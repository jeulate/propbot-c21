import { Bot, InlineKeyboard, type Context } from "grammy";
import { esAsesorAutorizado } from "@/lib/repositories/asesores";
import { crearCierre } from "@/lib/repositories/cierres";
import {
  guardarEstado,
  iniciarNuevoEstado,
  limpiarEstado,
  obtenerEstado,
  PREGUNTAS,
  siguientePaso,
  type DatosParciales,
  type EstadoConversacion,
} from "@/lib/bot/estado-conversacion";
import {
  validarBooleanoSiNo,
  validarFecha,
  validarId,
  validarMonto,
  validarTelefono,
  validarTexto,
  validarTipoCambio,
  validarTipoTransaccion,
} from "@/lib/bot/validadores";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("Falta la variable de entorno TELEGRAM_BOT_TOKEN.");
}

export const bot = new Bot(BOT_TOKEN);

const tecladoTipoTransaccion = new InlineKeyboard()
  .text("Venta", "tipo:VENTA")
  .text("Alquiler", "tipo:ALQUILER")
  .row()
  .text("Anticrético", "tipo:ANTICRÉTICO");

const tecladoSiNo = new InlineKeyboard().text("✅ Sí", "exclusiva:SI").text("❌ No", "exclusiva:NO");

const tecladoConfirmacion = new InlineKeyboard()
  .text("💾 Guardar cierre", "confirmar:SI")
  .row()
  .text("✏️ Cancelar y empezar de nuevo", "confirmar:NO");

const MENSAJE_BIENVENIDA =
  "👋 Hola, soy el *Asistente digital de Cierres* de la oficina *Century 21 Rita Quiroga*.\n\n" +
  "Te ayudaré a registrar tu cierre paso a paso para enviarlo al panel de administración.\n\n" +
  "*Procedimiento:*\n" +
  "1. Usa /nuevo para iniciar.\n" +
  "2. Responde cada pregunta con datos completos y claros.\n" +
  "3. Cuando llegues al resumen final, revisa todo y confirma con *Guardar cierre*.\n" +
  "4. Administración verificará el cierre y recibirás una notificación cuando quede registrado.\n\n" +
  "También puedes usar /cancelar para descartar un registro en curso.";

const MENSAJE_AYUDA =
  "🧭 *Guía rápida de registro*\n\n" +
  "- *ID:* escribe el número de expediente sin espacios innecesarios.\n" +
  "- *Fecha:* usa formato DD/MM/AAAA.\n" +
  "- *Montos y T.C.:* envía solo números (ejemplo: 12500 o 6.96).\n" +
  "- *Teléfonos:* incluye código de país si aplica (ejemplo: +59170000000).\n" +
  "- *Botones:* para Tipo de transacción y Exclusiva, usa los botones del chat.\n\n" +
  "Al final verás un resumen completo para confirmar antes de enviar al panel.";

async function requiereAutorizacion(ctx: Context): Promise<boolean> {
  const telegramId = String(ctx.from?.id ?? "");
  const autorizado = await esAsesorAutorizado(telegramId);
  if (!autorizado) {
    await ctx.reply(
      "🚫 No estás autorizado para usar este bot.\n\nPide a un administrador de Century 21 Rita Quiroga que registre tu cuenta de Telegram."
    );
    return false;
  }
  return true;
}

bot.command("start", async (ctx) => {
  if (!(await requiereAutorizacion(ctx))) return;
  await ctx.reply(MENSAJE_BIENVENIDA, { parse_mode: "Markdown" });
});

bot.command("ayuda", async (ctx) => {
  if (!(await requiereAutorizacion(ctx))) return;
  await ctx.reply(MENSAJE_AYUDA, { parse_mode: "Markdown" });
});

bot.command("cancelar", async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  await limpiarEstado(telegramId);
  await ctx.reply("❌ Registro en curso descartado. Usa /nuevo para empezar otra vez.");
});

bot.command("nuevo", async (ctx) => {
  if (!(await requiereAutorizacion(ctx))) return;
  const telegramId = String(ctx.from?.id ?? "");
  const estado = iniciarNuevoEstado();
  await guardarEstado(telegramId, estado);
  await ctx.reply(
    "📝 Iniciaremos el registro del cierre.\n" +
      "Responde una pregunta a la vez. Si te equivocas, puedes usar /cancelar y volver a comenzar.\n\n" +
      "Cuando termines, te mostraré un resumen para confirmar antes de enviarlo al panel.",
    { parse_mode: "Markdown" }
  );
  await ctx.reply(PREGUNTAS.ID, { parse_mode: "Markdown" });
});

// Botones de tipo de transacción
bot.callbackQuery(/^tipo:(.+)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  if (!estado || estado.paso !== "TIPO_TRANSACCION") {
    await ctx.answerCallbackQuery();
    return;
  }
  const valor = ctx.match![1] as DatosParciales["tipoTransaccion"];
  estado.datos.tipoTransaccion = valor;
  estado.paso = siguientePaso("TIPO_TRANSACCION");
  await guardarEstado(telegramId, estado);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🏷️ Tipo de transacción: *${valor}*`, { parse_mode: "Markdown" });
  await ctx.reply(PREGUNTAS.MONTO_TRANSACCION, { parse_mode: "Markdown" });
});

// Botones SI/NO de exclusiva
bot.callbackQuery(/^exclusiva:(SI|NO)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  if (!estado || estado.paso !== "EXCLUSIVA") {
    await ctx.answerCallbackQuery();
    return;
  }
  const esSi = ctx.match![1] === "SI";
  estado.datos.exclusiva = esSi;
  estado.paso = "CONFIRMACION";
  await guardarEstado(telegramId, estado);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🔒 Exclusiva: *${esSi ? "Sí" : "No"}*`, { parse_mode: "Markdown" });
  await enviarResumenConfirmacion(ctx, estado);
});

// Botones de confirmación final
bot.callbackQuery(/^confirmar:(SI|NO)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  await ctx.answerCallbackQuery();

  if (ctx.match![1] === "NO") {
    await limpiarEstado(telegramId);
    await ctx.editMessageText("❌ Registro descartado. Usa /nuevo para empezar de nuevo.");
    return;
  }

  if (!estado) {
    await ctx.editMessageText("⚠️ La sesión expiró. Usa /nuevo para empezar de nuevo.");
    return;
  }

  try {
    const d = estado.datos;
    await crearCierre({
      id: d.id!,
      fechaCierre: d.fechaCierre!,
      asesorCaptadorId: telegramId,
      asesorCaptadorNombre: d.asesorCaptadorNombre!,
      asesorColocadorId: telegramId,
      asesorColocadorNombre: d.asesorColocadorNombre!,
      direccionInmueble: d.direccionInmueble!,
      tipoTransaccion: d.tipoTransaccion!,
      montoTransaccion: d.montoTransaccion!,
      montoComision: d.montoComision!,
      tipoCambio: d.tipoCambio!,
      nombrePropietario: d.nombrePropietario!,
      telPropietario: d.telPropietario!,
      nombreCliente: d.nombreCliente!,
      telCliente: d.telCliente!,
      exclusiva: d.exclusiva!,
      registradoPorTelegramId: telegramId,
      registradoPorNombre: ctx.from?.first_name ?? "Desconocido",
    });

    await limpiarEstado(telegramId);
    await ctx.editMessageText(
      `✅ ¡Cierre *${d.id}* guardado correctamente!\n\nQuedará en estado *Pendiente de revisión* hasta que un administrador lo verifique.\n\nUsa /nuevo para registrar otro cierre.`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    await ctx.editMessageText(`⚠️ No se pudo guardar el cierre: ${mensaje}`);
  }
});

// Manejador genérico de texto: avanza la máquina de estados paso a paso
bot.on("message:text", async (ctx) => {
  if (!(await requiereAutorizacion(ctx))) return;

  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  if (!estado) {
    await ctx.reply("Usa /nuevo para iniciar el registro de un cierre.");
    return;
  }

  const texto = ctx.message.text;

  switch (estado.paso) {
    case "ID": {
      const r = validarId(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.id = r.value;
      break;
    }
    case "FECHA_CIERRE": {
      const r = validarFecha(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.fechaCierre = r.value;
      break;
    }
    case "ASESOR_CAPTADOR": {
      const r = validarTexto(texto, "El nombre del asesor captador");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorCaptadorNombre = r.value;
      break;
    }
    case "ASESOR_COLOCADOR": {
      const r = validarTexto(texto, "El nombre del asesor colocador");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorColocadorNombre = r.value;
      break;
    }
    case "DIRECCION_INMUEBLE": {
      const r = validarTexto(texto, "La dirección", 5, 200);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.direccionInmueble = r.value;
      break;
    }
    case "TIPO_TRANSACCION": {
      await ctx.reply("Por favor selecciona una opción usando los botones ⬇️", {
        reply_markup: tecladoTipoTransaccion,
      });
      return;
    }
    case "MONTO_TRANSACCION": {
      const r = validarMonto(texto, "El monto de la transacción");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.montoTransaccion = r.value;
      break;
    }
    case "MONTO_COMISION": {
      const r = validarMonto(texto, "El monto de la comisión");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.montoComision = r.value;
      break;
    }
    case "TIPO_CAMBIO": {
      const r = validarTipoCambio(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.tipoCambio = r.value;
      break;
    }
    case "NOMBRE_PROPIETARIO": {
      const r = validarTexto(texto, "El nombre del propietario");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.nombrePropietario = r.value;
      break;
    }
    case "TEL_PROPIETARIO": {
      const r = validarTelefono(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.telPropietario = r.value;
      break;
    }
    case "NOMBRE_CLIENTE": {
      const r = validarTexto(texto, "El nombre del cliente");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.nombreCliente = r.value;
      break;
    }
    case "TEL_CLIENTE": {
      const r = validarTelefono(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.telCliente = r.value;
      break;
    }
    case "EXCLUSIVA": {
      await ctx.reply("Por favor responde usando los botones ⬇️", { reply_markup: tecladoSiNo });
      return;
    }
    case "CONFIRMACION": {
      await ctx.reply("Por favor confirma usando los botones del mensaje anterior ⬆️");
      return;
    }
  }

  estado.paso = siguientePaso(estado.paso);
  await guardarEstado(telegramId, estado);
  await avanzarConSiguientePregunta(ctx, estado);
});

async function avanzarConSiguientePregunta(ctx: Context, estado: EstadoConversacion) {
  if (estado.paso === "TIPO_TRANSACCION") {
    await ctx.reply(PREGUNTAS.TIPO_TRANSACCION, {
      parse_mode: "Markdown",
      reply_markup: tecladoTipoTransaccion,
    });
    return;
  }
  if (estado.paso === "EXCLUSIVA") {
    await ctx.reply(PREGUNTAS.EXCLUSIVA, { parse_mode: "Markdown", reply_markup: tecladoSiNo });
    return;
  }
  if (estado.paso === "CONFIRMACION") {
    await enviarResumenConfirmacion(ctx, estado);
    return;
  }
  await ctx.reply(PREGUNTAS[estado.paso], { parse_mode: "Markdown" });
}

async function enviarResumenConfirmacion(ctx: Context, estado: EstadoConversacion) {
  const d = estado.datos;
  const resumen = [
    "✅ *Revisa el resumen del cierre:*",
    "",
    `🆔 ID: ${d.id}`,
    `📅 Fecha cierre: ${d.fechaCierre}`,
    `🧑‍💼 Asesor captador: ${d.asesorCaptadorNombre}`,
    `🤝 Asesor colocador: ${d.asesorColocadorNombre}`,
    `📍 Dirección: ${d.direccionInmueble}`,
    `🏷️ Tipo: ${d.tipoTransaccion}`,
    `💰 Monto transacción: $${d.montoTransaccion}`,
    `💵 Monto comisión: $${d.montoComision}`,
    `💱 T.C.: ${d.tipoCambio}`,
    `👤 Propietario: ${d.nombrePropietario} (${d.telPropietario})`,
    `👤 Cliente: ${d.nombreCliente} (${d.telCliente})`,
    `🔒 Exclusiva: ${d.exclusiva ? "Sí" : "No"}`,
    "",
    "Si los datos son correctos, presiona *Guardar cierre*. Si detectas un error, presiona *Cancelar y empezar de nuevo*.",
  ].join("\n");

  await ctx.reply(resumen, { parse_mode: "Markdown", reply_markup: tecladoConfirmacion });
}

bot.catch((err) => {
  console.error("Error no controlado en el bot de Telegram:", err);
});
