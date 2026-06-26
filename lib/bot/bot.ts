import { Bot, InlineKeyboard, type Context } from "grammy";
import { esAsesorAutorizado, obtenerAsesor } from "@/lib/repositories/asesores";
import { obtenerCategoriaAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { calcularComisionCierre } from "@/lib/comisiones";
import { crearCierre } from "@/lib/repositories/cierres";
import {
  guardarEstado,
  iniciarNuevoEstado,
  limpiarEstado,
  obtenerEstado,
  PREGUNTAS,
  type EstadoConversacion,
} from "@/lib/bot/estado-conversacion";
import {
  validarFecha,
  validarId,
  validarMonto,
  validarTelefono,
  validarTexto,
  validarTipoCambio,
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

const tecladoSiNo = new InlineKeyboard().text("✅ Sí", "si-no:SI").text("❌ No", "si-no:NO");

const tecladoConfirmacionComision = new InlineKeyboard()
  .text("✅ Confirmar comisión", "comision:SI")
  .row()
  .text("❌ No es correcta", "comision:NO");

const tecladoExclusiva = new InlineKeyboard().text("✅ Sí", "exclusiva:SI").text("❌ No", "exclusiva:NO");

const tecladoConfirmacionFinal = new InlineKeyboard()
  .text("💾 Guardar cierre", "confirmar:SI")
  .row()
  .text("✏️ Cancelar y empezar de nuevo", "confirmar:NO");

const MENSAJE_BIENVENIDA =
  "👋 Hola, soy el *Asistente digital de Cierres* de la oficina *Century 21 Rita Quiroga*.\n\n" +
  "Te ayudaré a registrar tu cierre paso a paso para enviarlo al panel de administración.\n\n" +
  "*Procedimiento:*\n" +
  "1. Usa /nuevo para iniciar.\n" +
  "2. El monto de comisión se calcula automáticamente en Bs según reglas de oficina y categoría.\n" +
  "3. Confirmas la comisión calculada y luego validas el resumen final.\n" +
  "4. Administración verificará el cierre y recibirás una notificación cuando quede registrado.\n\n" +
  "También puedes usar /cancelar para descartar un registro en curso.";

const MENSAJE_AYUDA =
  "🧭 *Guía rápida de registro*\n\n" +
  "- *Montos:* todos se registran en Bolivianos (Bs).\n" +
  "- *Comisión:* el bot la calcula automáticamente (no debes escribirla).\n" +
  "- *Captador/Colocador:* si no eres tú, te pediré nombre, oficina y teléfono.\n" +
  "- *Fecha:* usa formato DD/MM/AAAA.\n" +
  "- *Teléfonos:* incluye código de país si aplica (ejemplo: +59170000000).\n\n" +
  "Al final verás un resumen completo para confirmar antes de enviar al panel.";

function formatoBs(valor: number) {
  return `Bs ${new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 }).format(valor)}`;
}

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
  const asesor = await obtenerAsesor(telegramId);
  const estado = iniciarNuevoEstado();

  estado.datos.asesorRegistranteNombre = asesor?.nombre ?? ctx.from?.first_name ?? "Desconocido";

  await guardarEstado(telegramId, estado);
  await ctx.reply(
    "📝 Iniciaremos el registro del cierre.\n" +
      "El sistema calculará automáticamente la comisión que debe pagar la operación.\n\n" +
      "Si te equivocas, puedes usar /cancelar para volver a empezar.",
    { parse_mode: "Markdown" }
  );
  await ctx.reply(PREGUNTAS.ID, { parse_mode: "Markdown" });
});

bot.callbackQuery(/^tipo:(.+)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  if (!estado || estado.paso !== "TIPO_TRANSACCION") {
    await ctx.answerCallbackQuery();
    return;
  }

  const valor = ctx.match![1] as "VENTA" | "ALQUILER" | "ANTICRÉTICO";
  estado.datos.tipoTransaccion = valor;
  estado.paso = "MONTO_TRANSACCION";
  await guardarEstado(telegramId, estado);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🏷️ Tipo de transacción: *${valor}*`, { parse_mode: "Markdown" });
  await ctx.reply(PREGUNTAS.MONTO_TRANSACCION, { parse_mode: "Markdown" });
});

bot.callbackQuery(/^si-no:(SI|NO)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  if (!estado) {
    await ctx.answerCallbackQuery();
    return;
  }

  const esSi = ctx.match![1] === "SI";

  if (estado.paso === "CAPTADOR_ES_REGISTRANTE") {
    estado.datos.captadorEsRegistrante = esSi;
    if (esSi) {
      estado.datos.asesorCaptadorId = telegramId;
      estado.datos.asesorCaptadorNombre = estado.datos.asesorRegistranteNombre;
      estado.paso = "COLOCADOR_ES_REGISTRANTE";
      await guardarEstado(telegramId, estado);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText("🧑‍💼 Captador: *Tú mismo*", { parse_mode: "Markdown" });
      await ctx.reply(PREGUNTAS.COLOCADOR_ES_REGISTRANTE, {
        parse_mode: "Markdown",
        reply_markup: tecladoSiNo,
      });
      return;
    }

    estado.paso = "ASESOR_CAPTADOR_NOMBRE";
    await guardarEstado(telegramId, estado);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🧑‍💼 Captador: *Otro asesor*", { parse_mode: "Markdown" });
    await ctx.reply(PREGUNTAS.ASESOR_CAPTADOR_NOMBRE, { parse_mode: "Markdown" });
    return;
  }

  if (estado.paso === "COLOCADOR_ES_REGISTRANTE") {
    estado.datos.colocadorEsRegistrante = esSi;
    if (esSi) {
      estado.datos.asesorColocadorId = telegramId;
      estado.datos.asesorColocadorNombre = estado.datos.asesorRegistranteNombre;
      estado.paso = "DIRECCION_INMUEBLE";
      await guardarEstado(telegramId, estado);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText("🤝 Colocador: *Tú mismo*", { parse_mode: "Markdown" });
      await ctx.reply(PREGUNTAS.DIRECCION_INMUEBLE, { parse_mode: "Markdown" });
      return;
    }

    estado.paso = "ASESOR_COLOCADOR_NOMBRE";
    await guardarEstado(telegramId, estado);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🤝 Colocador: *Otro asesor*", { parse_mode: "Markdown" });
    await ctx.reply(PREGUNTAS.ASESOR_COLOCADOR_NOMBRE, { parse_mode: "Markdown" });
    return;
  }

  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^comision:(SI|NO)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  if (!estado || estado.paso !== "CONFIRMAR_COMISION") {
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();

  if (ctx.match![1] === "NO") {
    await limpiarEstado(telegramId);
    await ctx.editMessageText(
      "❌ Registro cancelado porque la comisión no fue confirmada. Usa /nuevo para recalcular y volver a registrar."
    );
    return;
  }

  estado.paso = "TIPO_CAMBIO";
  await guardarEstado(telegramId, estado);
  await ctx.editMessageText("✅ Comisión confirmada.");
  await ctx.reply(PREGUNTAS.TIPO_CAMBIO, { parse_mode: "Markdown" });
});

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
      asesorCaptadorId: d.asesorCaptadorId!,
      asesorCaptadorNombre: d.asesorCaptadorNombre!,
      asesorCaptadorOficina: d.asesorCaptadorOficina,
      asesorCaptadorTelefono: d.asesorCaptadorTelefono,
      asesorColocadorId: d.asesorColocadorId!,
      asesorColocadorNombre: d.asesorColocadorNombre!,
      asesorColocadorOficina: d.asesorColocadorOficina,
      asesorColocadorTelefono: d.asesorColocadorTelefono,
      direccionInmueble: d.direccionInmueble!,
      tipoTransaccion: d.tipoTransaccion!,
      montoTransaccion: d.montoTransaccion!,
      tipoCambio: d.tipoCambio!,
      nombrePropietario: d.nombrePropietario!,
      telPropietario: d.telPropietario!,
      nombreCliente: d.nombreCliente!,
      telCliente: d.telCliente!,
      exclusiva: d.exclusiva!,
      registradoPorTelegramId: telegramId,
      registradoPorNombre: d.asesorRegistranteNombre ?? ctx.from?.first_name ?? "Desconocido",
    });

    await limpiarEstado(telegramId);
    await ctx.editMessageText(
      `✅ ¡Cierre *${d.id}* guardado correctamente!\n\nComisión registrada: *${formatoBs(d.montoComision ?? 0)}*\n\nUsa /nuevo para registrar otro cierre.`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    await ctx.editMessageText(`⚠️ No se pudo guardar el cierre: ${mensaje}`);
  }
});

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
      estado.paso = "FECHA_CIERRE";
      break;
    }
    case "FECHA_CIERRE": {
      const r = validarFecha(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.fechaCierre = r.value;
      estado.paso = "CAPTADOR_ES_REGISTRANTE";
      break;
    }
    case "ASESOR_CAPTADOR_NOMBRE": {
      const r = validarTexto(texto, "El nombre del asesor captador");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorCaptadorNombre = r.value;
      estado.datos.asesorCaptadorId = `externo:${r.value.toLowerCase().replace(/\s+/g, "-")}`;
      estado.paso = "ASESOR_CAPTADOR_OFICINA";
      break;
    }
    case "ASESOR_CAPTADOR_OFICINA": {
      const r = validarTexto(texto, "La oficina del asesor captador");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorCaptadorOficina = r.value;
      estado.paso = "ASESOR_CAPTADOR_TELEFONO";
      break;
    }
    case "ASESOR_CAPTADOR_TELEFONO": {
      const r = validarTelefono(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorCaptadorTelefono = r.value;
      estado.paso = "COLOCADOR_ES_REGISTRANTE";
      break;
    }
    case "ASESOR_COLOCADOR_NOMBRE": {
      const r = validarTexto(texto, "El nombre del asesor colocador");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorColocadorNombre = r.value;
      estado.datos.asesorColocadorId = `externo:${r.value.toLowerCase().replace(/\s+/g, "-")}`;
      estado.paso = "ASESOR_COLOCADOR_OFICINA";
      break;
    }
    case "ASESOR_COLOCADOR_OFICINA": {
      const r = validarTexto(texto, "La oficina del asesor colocador");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorColocadorOficina = r.value;
      estado.paso = "ASESOR_COLOCADOR_TELEFONO";
      break;
    }
    case "ASESOR_COLOCADOR_TELEFONO": {
      const r = validarTelefono(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.asesorColocadorTelefono = r.value;
      estado.paso = "DIRECCION_INMUEBLE";
      break;
    }
    case "DIRECCION_INMUEBLE": {
      const r = validarTexto(texto, "La dirección", 5, 200);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.direccionInmueble = r.value;
      estado.paso = "TIPO_TRANSACCION";
      break;
    }
    case "MONTO_TRANSACCION": {
      const r = validarMonto(texto, "El monto de la transacción");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.montoTransaccion = r.value;

      const asesor = await obtenerAsesor(telegramId);
      if (!asesor) return ctx.reply("⚠️ No se encontró tu perfil de asesor. Contacta a un administrador.");
      const categoria = await obtenerCategoriaAsesor(asesor.categoriaId);
      if (!categoria || !categoria.activo) {
        return ctx.reply("⚠️ Tu categoría está inactiva. Contacta a administración para actualizarla.");
      }
      const config = await obtenerConfiguracionComisiones();

      const esMismo =
         estado.datos.asesorCaptadorId === estado.datos.asesorColocadorId;

      const comision = calcularComisionCierre({
        montoTransaccion: r.value,
        tipoTransaccion: estado.datos.tipoTransaccion!,
        esCaptadorYColocadorMismoAsesor: esMismo,
        porcentajeOficinaNacional: config.porcentajeOficinaNacional,
        porcentajeCategoriaAsesor: categoria.porcentajeComision,
      });

      estado.datos.porcentajeBaseComision = comision.porcentajeBaseComision;
      estado.datos.porcentajeOficinaNacionalAplicado = comision.porcentajeOficinaNacionalAplicado;
      estado.datos.porcentajeOficinaLocalAplicado = comision.porcentajeOficinaLocalAplicado;
      estado.datos.porcentajeCategoriaAplicado = comision.porcentajeCategoriaAplicado;
      estado.datos.montoPagoOficinaNacional = comision.montoPagoOficinaNacional;
      estado.datos.montoPagoOficinaLocal = comision.montoPagoOficinaLocal;
      estado.datos.montoPagoRealAsesor = comision.montoPagoRealAsesor;
      estado.datos.montoComision = comision.montoComisionTotal;
      estado.paso = "CONFIRMAR_COMISION";
      break;
    }
    case "TIPO_CAMBIO": {
      const r = validarTipoCambio(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.tipoCambio = r.value;
      estado.paso = "NOMBRE_PROPIETARIO";
      break;
    }
    case "NOMBRE_PROPIETARIO": {
      const r = validarTexto(texto, "El nombre del propietario");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.nombrePropietario = r.value;
      estado.paso = "TEL_PROPIETARIO";
      break;
    }
    case "TEL_PROPIETARIO": {
      const r = validarTelefono(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.telPropietario = r.value;
      estado.paso = "NOMBRE_CLIENTE";
      break;
    }
    case "NOMBRE_CLIENTE": {
      const r = validarTexto(texto, "El nombre del cliente");
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.nombreCliente = r.value;
      estado.paso = "TEL_CLIENTE";
      break;
    }
    case "TEL_CLIENTE": {
      const r = validarTelefono(texto);
      if (!r.ok) return ctx.reply(`⚠️ ${r.error}`);
      estado.datos.telCliente = r.value;
      estado.paso = "EXCLUSIVA";
      break;
    }
    default: {
      return ctx.reply("Usa los botones disponibles para continuar este paso.");
    }
  }

  await guardarEstado(telegramId, estado);
  await avanzarConSiguientePregunta(ctx, estado);
});

async function avanzarConSiguientePregunta(ctx: Context, estado: EstadoConversacion) {
  if (estado.paso === "CAPTADOR_ES_REGISTRANTE" || estado.paso === "COLOCADOR_ES_REGISTRANTE") {
    await ctx.reply(PREGUNTAS[estado.paso], { parse_mode: "Markdown", reply_markup: tecladoSiNo });
    return;
  }
  if (estado.paso === "TIPO_TRANSACCION") {
    await ctx.reply(PREGUNTAS.TIPO_TRANSACCION, {
      parse_mode: "Markdown",
      reply_markup: tecladoTipoTransaccion,
    });
    return;
  }
  if (estado.paso === "CONFIRMAR_COMISION") {
    const d = estado.datos;
    const detalle = [
      "💰 *Comisión calculada automáticamente*",
      "",
      `- Base de comisión aplicada: ${d.porcentajeBaseComision}%`,
      `- Oficina Nacional (${d.porcentajeOficinaNacionalAplicado}%): ${formatoBs(
        d.montoPagoOficinaNacional ?? 0
      )}`,
      `- Oficina local (${d.porcentajeOficinaLocalAplicado}%): ${formatoBs(
        d.montoPagoOficinaLocal ?? 0
      )}`,
      `- Categoría asesor (${d.porcentajeCategoriaAplicado}%): ${formatoBs(d.montoPagoRealAsesor ?? 0)}`,
      "",
      `💵 *Comisión a registrar = Oficina Nacional + Oficina local = ${formatoBs(d.montoComision ?? 0)}*`,
      "",
      "¿Confirmas que este monto es correcto?",
    ].join("\n");

    await ctx.reply(detalle, { parse_mode: "Markdown", reply_markup: tecladoConfirmacionComision });
    return;
  }
  if (estado.paso === "EXCLUSIVA") {
    await ctx.reply(PREGUNTAS.EXCLUSIVA, { parse_mode: "Markdown", reply_markup: tecladoExclusiva });
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
    d.asesorCaptadorOficina ? `🏢 Oficina captador: ${d.asesorCaptadorOficina}` : "",
    d.asesorCaptadorTelefono ? `📞 Tel. captador: ${d.asesorCaptadorTelefono}` : "",
    `🤝 Asesor colocador: ${d.asesorColocadorNombre}`,
    d.asesorColocadorOficina ? `🏢 Oficina colocador: ${d.asesorColocadorOficina}` : "",
    d.asesorColocadorTelefono ? `📞 Tel. colocador: ${d.asesorColocadorTelefono}` : "",
    `📍 Dirección: ${d.direccionInmueble}`,
    `🏷️ Tipo: ${d.tipoTransaccion}`,
    `💰 Monto transacción: ${formatoBs(d.montoTransaccion ?? 0)}`,
    `📊 Comisión base: ${formatoBs(
    ((d.montoTransaccion ?? 0) * (d.porcentajeBaseComision ?? 0)) / 100
    )} (${d.porcentajeBaseComision ?? 0}%)`,
    `🏢 Oficina nacional (${d.porcentajeOficinaNacionalAplicado ?? 0}%): ${formatoBs(
    d.montoPagoOficinaNacional ?? 0
    )}`,
    `🏬 Oficina local (${d.porcentajeOficinaLocalAplicado ?? 0}%): ${formatoBs(
    d.montoPagoOficinaLocal ?? 0
    )}`,
    `💵 Comisión registrada: ${formatoBs(d.montoComision ?? 0)}`,
    `👤 Pago real asesor (${d.porcentajeCategoriaAplicado ?? 0}%): ${formatoBs(
    d.montoPagoRealAsesor ?? 0
    )}`,
    `💱 T.C.: ${d.tipoCambio}`,
    `👤 Propietario: ${d.nombrePropietario} (${d.telPropietario})`,
    `👤 Cliente: ${d.nombreCliente} (${d.telCliente})`,
    `🔒 Exclusiva: ${d.exclusiva ? "Sí" : "No"}`,
    "",
    "Si los datos son correctos, presiona *Guardar cierre*. Si detectas un error, presiona *Cancelar y empezar de nuevo*.",
  ]
    .filter(Boolean)
    .join("\n");

  await ctx.reply(resumen, { parse_mode: "Markdown", reply_markup: tecladoConfirmacionFinal });
}

bot.catch((err) => {
  console.error("Error no controlado en el bot de Telegram:", err);
});
