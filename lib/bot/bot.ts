import { Bot, InlineKeyboard, type Context } from "grammy";
import {
  esAsesorAutorizado,
  obtenerAsesor,
  listarAsesores,
} from "@/lib/repositories/asesores";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { obtenerCategoriaAsesor } from "@/lib/repositories/categorias-asesor";
import { calcularComisionCierre } from "@/lib/comisiones";
import { calcularComisionCierreTeam } from "@/lib/comisiones-team";
import { obtenerAgrupacion } from "@/lib/repositories/agrupaciones-asesor";
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
} from "@/lib/bot/validadores";
import { buscarPropiedadPorId } from "@/lib/services/propiedades-c21";
import { obtenerCuentaComision } from "@/lib/repositories/cuenta-comision";

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

const tecladoSiNo = new InlineKeyboard()
  .text("✅ Sí", "si-no:SI")
  .text("❌ No", "si-no:NO");
const tecladoTipoAsesor = new InlineKeyboard()
  .text("🏢 Asesor de la oficina", "tipo-asesor:INTERNO")
  .row()
  .text("🌐 Asesor externo", "tipo-asesor:EXTERNO");

const tecladoConfirmacionComision = new InlineKeyboard()
  .text("✅ Confirmar comisión", "comision:SI")
  .row()
  .text("❌ No es correcta", "comision:NO");

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

function resolverRolRegistro(
  d: EstadoConversacion["datos"],
): "CAPTADOR" | "COLOCADOR" | "AMBOS" {
  if (d.captadorEsRegistrante && d.colocadorEsRegistrante) return "AMBOS";
  if (d.captadorEsRegistrante) return "CAPTADOR";
  if (d.colocadorEsRegistrante) return "COLOCADOR";

  throw new Error(
    "El asesor registrante debe ser captador, colocador o ambos.",
  );
}

async function requiereAutorizacion(ctx: Context): Promise<boolean> {
  const telegramId = String(ctx.from?.id ?? "");
  const autorizado = await esAsesorAutorizado(telegramId);
  if (!autorizado) {
    await ctx.reply(
      "🚫 No estás autorizado para usar este bot.\n\nPide a un administrador de Century 21 Rita Quiroga que registre tu cuenta de Telegram.",
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
  await ctx.reply(
    "❌ Registro en curso descartado. Usa /nuevo para empezar otra vez.",
  );
});

bot.command("nuevo", async (ctx) => {
  if (!(await requiereAutorizacion(ctx))) return;
  const telegramId = String(ctx.from?.id ?? "");
  const asesor = await obtenerAsesor(telegramId);
  const estado = iniciarNuevoEstado();

  estado.datos.asesorRegistranteNombre =
    asesor?.nombre ?? ctx.from?.first_name ?? "Desconocido";

  await guardarEstado(telegramId, estado);
  await ctx.reply(
    "📝 Iniciaremos el registro del cierre.\n" +
      "El sistema calculará automáticamente la comisión que debe pagar la operación.\n\n" +
      "Si te equivocas, puedes usar /cancelar para volver a empezar.",
    { parse_mode: "Markdown" },
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
  await ctx.editMessageText(`🏷️ Tipo de transacción: *${valor}*`, {
    parse_mode: "Markdown",
  });
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
      await ctx.editMessageText("🧑‍💼 Captador: *Tú mismo*", {
        parse_mode: "Markdown",
      });
      await ctx.reply(PREGUNTAS.COLOCADOR_ES_REGISTRANTE, {
        parse_mode: "Markdown",
        reply_markup: tecladoSiNo,
      });
      return;
    }

    estado.paso = "CAPTADOR_INTERNO_O_EXTERNO";
    await guardarEstado(telegramId, estado);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🧑‍💼 Captador: *Otro asesor*", {
      parse_mode: "Markdown",
    });

    await ctx.reply(PREGUNTAS.CAPTADOR_INTERNO_O_EXTERNO, {
      parse_mode: "Markdown",
      reply_markup: tecladoTipoAsesor,
    });
    return;
  }

  if (estado.paso === "COLOCADOR_ES_REGISTRANTE") {
    estado.datos.colocadorEsRegistrante = esSi;
    if (esSi) {
      estado.datos.asesorColocadorId = telegramId;
      estado.datos.asesorColocadorNombre = estado.datos.asesorRegistranteNombre;
      estado.paso = estado.datos.direccionInmueble
        ? "TIPO_TRANSACCION"
        : "DIRECCION_INMUEBLE";
      await guardarEstado(telegramId, estado);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText("🤝 Colocador: *Tú mismo*", {
        parse_mode: "Markdown",
      });
      await avanzarConSiguientePregunta(ctx, estado);
      return;
    }

    estado.paso = "COLOCADOR_INTERNO_O_EXTERNO";
    await guardarEstado(telegramId, estado);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🤝 Colocador: *Otro asesor*", {
      parse_mode: "Markdown",
    });
    await ctx.reply(PREGUNTAS.COLOCADOR_INTERNO_O_EXTERNO, {
      parse_mode: "Markdown",
      reply_markup: tecladoTipoAsesor,
    });
    return;
  }

  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^tipo-asesor:(INTERNO|EXTERNO)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);

  if (!estado) {
    await ctx.answerCallbackQuery();
    await ctx.reply("⚠️ La sesión expiró. Usa /nuevo para empezar nuevamente.");
    return;
  }

  const tipo = ctx.match![1] as "INTERNO" | "EXTERNO";

  if (estado.paso === "CAPTADOR_INTERNO_O_EXTERNO") {
    await ctx.answerCallbackQuery();

    if (tipo === "INTERNO") {
      await ctx.editMessageText("🧑‍💼 Captador: *Asesor de la oficina*", {
        parse_mode: "Markdown",
      });

      await ctx.reply("Selecciona el asesor captador:", {
        reply_markup: await crearTecladoSeleccionAsesor("CAPTADOR", telegramId),
      });
      return;
    }

    estado.paso = "ASESOR_CAPTADOR_NOMBRE";
    await guardarEstado(telegramId, estado);

    await ctx.editMessageText("🧑‍💼 Captador: *Asesor externo*", {
      parse_mode: "Markdown",
    });

    await ctx.reply(PREGUNTAS.ASESOR_CAPTADOR_NOMBRE, {
      parse_mode: "Markdown",
    });
    return;
  }

  if (estado.paso === "COLOCADOR_INTERNO_O_EXTERNO") {
    await ctx.answerCallbackQuery();

    if (tipo === "INTERNO") {
      await ctx.editMessageText("🤝 Colocador: *Asesor de la oficina*", {
        parse_mode: "Markdown",
      });

      await ctx.reply("Selecciona el asesor colocador:", {
        reply_markup: await crearTecladoSeleccionAsesor(
          "COLOCADOR",
          telegramId,
        ),
      });
      return;
    }

    estado.paso = "ASESOR_COLOCADOR_NOMBRE";
    await guardarEstado(telegramId, estado);

    await ctx.editMessageText("🤝 Colocador: *Asesor externo*", {
      parse_mode: "Markdown",
    });

    await ctx.reply(PREGUNTAS.ASESOR_COLOCADOR_NOMBRE, {
      parse_mode: "Markdown",
    });
    return;
  }

  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^asesor:(CAPTADOR|COLOCADOR):(.+)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);

  if (!estado) {
    await ctx.answerCallbackQuery();
    return;
  }

  const rol = ctx.match![1] as "CAPTADOR" | "COLOCADOR";
  const asesorId = ctx.match![2];

  const pasoEsperado =
    rol === "CAPTADOR"
      ? "CAPTADOR_INTERNO_O_EXTERNO"
      : "COLOCADOR_INTERNO_O_EXTERNO";

  if (estado.paso !== pasoEsperado) {
    await ctx.answerCallbackQuery();
    return;
  }

  const asesor = await obtenerAsesor(asesorId);
  const configuracion = await obtenerConfiguracionComisiones();

  if (!asesor || !asesor.activo) {
    await ctx.answerCallbackQuery();
    await ctx.reply("⚠️ El asesor seleccionado no existe o está inactivo.");
    return;
  }

  if (rol === "CAPTADOR") {
    estado.datos.asesorCaptadorId = asesor.telegramId;
    estado.datos.asesorCaptadorNombre = asesor.nombre;
    estado.datos.asesorCaptadorOficina = configuracion.nombreOficina ?? "";
    estado.datos.asesorCaptadorTelefono = asesor.celular ?? "";
    estado.paso = "COLOCADOR_ES_REGISTRANTE";

    await guardarEstado(telegramId, estado);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`🧑‍💼 Captador seleccionado: *${asesor.nombre}*`, {
      parse_mode: "Markdown",
    });

    await ctx.reply(PREGUNTAS.COLOCADOR_ES_REGISTRANTE, {
      parse_mode: "Markdown",
      reply_markup: tecladoSiNo,
    });
    return;
  }

  estado.datos.asesorColocadorId = asesor.telegramId;
  estado.datos.asesorColocadorNombre = asesor.nombre;
  estado.datos.asesorColocadorOficina = configuracion.nombreOficina ?? "";
  estado.datos.asesorColocadorTelefono = asesor.celular ?? "";
  estado.paso = estado.datos.direccionInmueble
    ? "TIPO_TRANSACCION"
    : "DIRECCION_INMUEBLE";

  await guardarEstado(telegramId, estado);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🤝 Colocador seleccionado: *${asesor.nombre}*`, {
    parse_mode: "Markdown",
  });

  await avanzarConSiguientePregunta(ctx, estado);
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
      "❌ Registro cancelado porque la comisión no fue confirmada. Usa /nuevo para recalcular y volver a registrar.",
    );
    return;
  }

  estado.datos.tipoCambio = 1;
  estado.paso = "NOMBRE_PROPIETARIO";
  await guardarEstado(telegramId, estado);
  await ctx.editMessageText("✅ Comisión confirmada.");
  await ctx.reply(PREGUNTAS.NOMBRE_PROPIETARIO, { parse_mode: "Markdown" });
});

bot.callbackQuery(/^confirmar:(SI|NO)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  await ctx.answerCallbackQuery();

  if (ctx.match![1] === "NO") {
    await limpiarEstado(telegramId);
    await ctx.editMessageText(
      "❌ Registro descartado. Usa /nuevo para empezar de nuevo.",
    );
    return;
  }

  if (!estado) {
    await ctx.editMessageText(
      "⚠️ La sesión expiró. Usa /nuevo para empezar de nuevo.",
    );
    return;
  }

  try {
    const d = estado.datos;
    const cierreCreado = await crearCierre({
      idInmueble: d.idInmueble!,
      rolRegistro: resolverRolRegistro(d),
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
      tipoCambio: d.tipoCambio ?? 1,
      nombrePropietario: d.nombrePropietario!,
      telPropietario: d.telPropietario!,
      nombreCliente: d.nombreCliente!,
      telCliente: d.telCliente!,
      exclusiva: d.exclusiva ?? true,
      comprobantePagoFileId: d.comprobantePagoFileId,
      comprobantePagoFileUniqueId: d.comprobantePagoFileUniqueId,
      comprobantePagoTipo: d.comprobantePagoTipo,
      comprobantePagoNombreArchivo: d.comprobantePagoNombreArchivo,
      comprobantePagoMimeType: d.comprobantePagoMimeType,
      comprobanteOficinaFileId: d.comprobanteOficinaFileId,
      comprobanteOficinaFileUniqueId: d.comprobanteOficinaFileUniqueId,
      comprobanteOficinaTipo: d.comprobanteOficinaTipo,
      comprobanteTeamLeaderFileId: d.comprobanteTeamLeaderFileId,
      comprobanteTeamLeaderFileUniqueId: d.comprobanteTeamLeaderFileUniqueId,
      comprobanteTeamLeaderTipo: d.comprobanteTeamLeaderTipo,
      registradoPorTelegramId: telegramId,
      registradoPorNombre:
        d.asesorRegistranteNombre ?? ctx.from?.first_name ?? "Desconocido",
    });

    await limpiarEstado(telegramId);
    await ctx.editMessageText(
      `✅ ¡Cierre *${cierreCreado.id}* registrado correctamente!\n\nComisión registrada: *${formatoBs(d.montoComision ?? 0)}*\n\n${d.tipoCalculoComision === "TEAM" ? "📸 Los comprobantes de oficina y Team Leader fueron recibidos" : "📸 El comprobante fue recibido"} y el cierre quedó pendiente de revisión administrativa.\n\nUsa /nuevo para registrar otro cierre.`,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    await ctx.editMessageText(`⚠️ No se pudo guardar el cierre: ${mensaje}`);
  }
});

bot.on("message:photo", async (ctx) => {
  if (!(await requiereAutorizacion(ctx))) return;
  const telegramId = String(ctx.from?.id ?? "");
  const estado = await obtenerEstado(telegramId);
  const pasosComprobante = [
    "COMPROBANTE_PAGO",
    "COMPROBANTE_OFICINA",
    "COMPROBANTE_TEAM_LEADER",
  ];
  if (!estado || !pasosComprobante.includes(estado.paso)) {
    await ctx.reply("Usa /nuevo para iniciar el registro de un cierre.");
    return;
  }

  const foto = ctx.message.photo[ctx.message.photo.length - 1];
  if (estado.paso === "COMPROBANTE_OFICINA") {
    estado.datos.comprobanteOficinaFileId = foto.file_id;
    estado.datos.comprobanteOficinaFileUniqueId = foto.file_unique_id;
    estado.datos.comprobanteOficinaTipo = "photo";
    estado.paso = "COMPROBANTE_TEAM_LEADER";
    await guardarEstado(telegramId, estado);
    await ctx.reply("✅ Comprobante de oficina recibido.");
    await ctx.reply(PREGUNTAS.COMPROBANTE_TEAM_LEADER, { parse_mode: "Markdown" });
    return;
  }
  if (estado.paso === "COMPROBANTE_TEAM_LEADER") {
    estado.datos.comprobanteTeamLeaderFileId = foto.file_id;
    estado.datos.comprobanteTeamLeaderFileUniqueId = foto.file_unique_id;
    estado.datos.comprobanteTeamLeaderTipo = "photo";
  } else {
    estado.datos.comprobantePagoFileId = foto.file_id;
    estado.datos.comprobantePagoFileUniqueId = foto.file_unique_id;
    estado.datos.comprobantePagoTipo = "photo";
  }
  estado.paso = "CONFIRMACION";
  await guardarEstado(telegramId, estado);
  await ctx.reply("✅ Comprobante recibido correctamente.");
  await enviarResumenConfirmacion(ctx, estado);
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

      await ctx.reply("🔎 Verificando el ID del inmueble en c21.com.bo...");

      const propiedad = await buscarPropiedadPorId(r.value);

      if (!propiedad) {
        return ctx.reply(
          "⚠️ No encontré una propiedad activa con ese ID en c21.com.bo.\n\nPor favor verifica el ID e intenta nuevamente.",
        );
      }

      estado.datos.idInmueble = r.value;

      estado.datos.tituloPropiedad = propiedad.titulo;
      estado.datos.urlPropiedad = propiedad.url;
      estado.datos.exclusiva = true;
      if (propiedad.direccion) {
        estado.datos.direccionInmueble = propiedad.direccion;
      }

      await ctx.reply(
        `✅ Propiedad encontrada:\n\n${propiedad.titulo}\n${propiedad.url}`,
      );

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
      estado.paso = estado.datos.direccionInmueble
        ? "TIPO_TRANSACCION"
        : "DIRECCION_INMUEBLE";
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
      if (!asesor)
        return ctx.reply(
          "⚠️ No se encontró tu perfil de asesor. Contacta a un administrador.",
        );
      const categoria = await obtenerCategoriaAsesor(asesor.categoriaId);
      if (!categoria || !categoria.activo) {
        return ctx.reply(
          "⚠️ Tu categoría está inactiva. Contacta a administración para actualizarla.",
        );
      }
      const config = await obtenerConfiguracionComisiones();

      const esMismo =
        estado.datos.asesorCaptadorId === estado.datos.asesorColocadorId;

      if (asesor.teamId) {
        const team = await obtenerAgrupacion(asesor.teamId);
        if (!team || team.tipo !== "TEAM" || !team.activo || !team.responsableTelegramId) {
          return ctx.reply("⚠️ Tu Team no está activo o no tiene Team Leader asignado.");
        }
        const teamLeader = await obtenerAsesor(team.responsableTelegramId);
        const configTeam = config.comisionesTeamPorCategoria.find(
          (item) => item.categoriaId === categoria.id,
        );
        if (!teamLeader?.activo || !configTeam) {
          return ctx.reply("⚠️ No existe una configuración Team válida para tu categoría.");
        }
        const comision = calcularComisionCierreTeam({
          montoTransaccion: r.value,
          tipoTransaccion: estado.datos.tipoTransaccion!,
          esCaptadorYColocadorMismoAsesor: esMismo,
          porcentajeOficinaTeam: configTeam.porcentajeOficina,
          porcentajeTeamLeader: configTeam.porcentajeTeamLeader,
        });
        estado.datos.tipoCalculoComision = "TEAM";
        estado.datos.teamNombreAplicado = team.nombre;
        estado.datos.teamLeaderNombreAplicado = teamLeader.nombre;
        estado.datos.porcentajeOficinaNacionalAplicado = 0;
        estado.datos.porcentajeOficinaLocalAplicado = comision.porcentajeOficinaTeamAplicado;
        estado.datos.porcentajeOficinaTeamAplicado = comision.porcentajeOficinaTeamAplicado;
        estado.datos.porcentajeTeamLeaderAplicado = comision.porcentajeTeamLeaderAplicado;
        estado.datos.montoPagoOficinaNacional = 0;
        estado.datos.montoPagoOficinaLocal = comision.montoPagoOficinaTeam;
        estado.datos.montoPagoTeamLeader = comision.montoPagoTeamLeader;
        estado.datos.montoPagoRealAsesor = comision.montoPagoRealAsesor;
        estado.datos.montoComision = comision.montoComisionTotal;
      } else {
        const comision = calcularComisionCierre({
          montoTransaccion: r.value,
          tipoTransaccion: estado.datos.tipoTransaccion!,
          esCaptadorYColocadorMismoAsesor: esMismo,
          porcentajeOficinaNacional: config.porcentajeOficinaNacional,
          porcentajeCategoriaAsesor: categoria.porcentajeComision,
        });
        estado.datos.tipoCalculoComision = "INDIVIDUAL";
        estado.datos.porcentajeBaseComision = comision.porcentajeBaseComision;
        estado.datos.porcentajeOficinaNacionalAplicado = comision.porcentajeOficinaNacionalAplicado;
        estado.datos.porcentajeOficinaLocalAplicado = comision.porcentajeOficinaLocalAplicado;
        estado.datos.porcentajeCategoriaAplicado = comision.porcentajeCategoriaAplicado;
        estado.datos.montoPagoOficinaNacional = comision.montoPagoOficinaNacional;
        estado.datos.montoPagoOficinaLocal = comision.montoPagoOficinaLocal;
        estado.datos.montoPagoRealAsesor = comision.montoPagoRealAsesor;
        estado.datos.montoComision = comision.montoComisionTotal;
      }
      estado.paso = "CONFIRMAR_COMISION";
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
      estado.paso = estado.datos.tipoCalculoComision === "TEAM"
        ? "COMPROBANTE_OFICINA"
        : "COMPROBANTE_PAGO";
      break;
    }
    default: {
      return ctx.reply("Usa los botones disponibles para continuar este paso.");
    }
  }
  await guardarEstado(telegramId, estado);
  await avanzarConSiguientePregunta(ctx, estado);
});

async function avanzarConSiguientePregunta(
  ctx: Context,
  estado: EstadoConversacion,
) {
  if (
    estado.paso === "CAPTADOR_ES_REGISTRANTE" ||
    estado.paso === "COLOCADOR_ES_REGISTRANTE"
  ) {
    await ctx.reply(PREGUNTAS[estado.paso], {
      parse_mode: "Markdown",
      reply_markup: tecladoSiNo,
    });
    return;
  }

  if (estado.paso === "CAPTADOR_INTERNO_O_EXTERNO") {
    const telegramId = String(ctx.from?.id ?? "");
    await ctx.reply(PREGUNTAS.CAPTADOR_INTERNO_O_EXTERNO, {
      parse_mode: "Markdown",
      reply_markup: tecladoTipoAsesor,
    });
    return;
  }

  if (estado.paso === "COLOCADOR_INTERNO_O_EXTERNO") {
    const telegramId = String(ctx.from?.id ?? "");
    await ctx.reply(PREGUNTAS.COLOCADOR_INTERNO_O_EXTERNO, {
      parse_mode: "Markdown",
      reply_markup: tecladoTipoAsesor,
    });
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
      " *Comisión calculada automáticamente*",
      "",
      `- Base de comisión aplicada: ${d.porcentajeBaseComision}%`,
      /*`- Oficina Nacional (${d.porcentajeOficinaNacionalAplicado}%): ${formatoBs(
        d.montoPagoOficinaNacional ?? 0
      )}`,
      `- Oficina local (${d.porcentajeOficinaLocalAplicado}%): ${formatoBs(
        d.montoPagoOficinaLocal ?? 0
      )}`,*/
      `- Categoría asesor (${d.porcentajeCategoriaAplicado}%): ${formatoBs(d.montoPagoRealAsesor ?? 0)}`,
      "",
      `💵 *Comisión a registrar = ${formatoBs(d.montoComision ?? 0)}*`,
      "",
      "¿Confirmas que este monto es correcto?",
    ].join("\n");

    await ctx.reply(detalle, {
      parse_mode: "Markdown",
      reply_markup: tecladoConfirmacionComision,
    });
    return;
  }

  if (estado.paso === "COMPROBANTE_PAGO") {
    const montoDeposito = formatoBs(estado.datos.montoComision ?? 0);

    const cuentaComision = await obtenerCuentaComision();

    const datosCuenta = cuentaComision
      ? [
          "Datos para el depósito:",
          "",
          `Banco: ${cuentaComision.banco}`,
          `Cuenta: ${cuentaComision.cuenta}`,
          `Titular: ${cuentaComision.titular}`,
          `NIT/CI: ${cuentaComision.nitCi}`,
        ].join("\n")
      : [
          "⚠️ *Datos de cuenta no configurados.*",
          "",
          "Comunícate con administración antes de realizar el depósito.",
        ].join("\n");

    const mensaje = [
      "📸 Adjunta una *imagen del comprobante de pago de la comisión*.",
      "",
      `💰 *Monto a depositar:* ${montoDeposito}`,
      "",
      datosCuenta,
      "",
      "Debe verse claramente el monto pagado en el comprobante.",
    ].join("\n");

    await ctx.reply(mensaje, { parse_mode: "Markdown" });
    return;
  }

  if (estado.paso === "CONFIRMACION") {
    await enviarResumenConfirmacion(ctx, estado);
    return;
  }

  await ctx.reply(PREGUNTAS[estado.paso], { parse_mode: "Markdown" });
}

async function crearTecladoSeleccionAsesor(
  rol: "CAPTADOR" | "COLOCADOR",
  telegramIdRegistrante: string,
) {
  const asesores = (await listarAsesores()).filter(
    (a) => a.activo && a.telegramId !== telegramIdRegistrante,
  );

  const teclado = new InlineKeyboard();

  asesores.slice(0, 20).forEach((asesor, index) => {
    teclado.text(asesor.nombre, `asesor:${rol}:${asesor.telegramId}`);
    if ((index + 1) % 1 === 0) teclado.row();
  });

  return teclado;
}

function escaparHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function enviarResumenConfirmacion(
  ctx: Context,
  estado: EstadoConversacion,
) {
  const d = estado.datos;

  const resumen = [
    "✅ <b>Revisa el resumen del cierre:</b>",
    "",
    `🆔 ID inmueble: ${escaparHtml(d.idInmueble)}`,
    d.tituloPropiedad ? `🏠 Propiedad: ${escaparHtml(d.tituloPropiedad)}` : "",
    d.urlPropiedad ? `🔗 URL: ${escaparHtml(d.urlPropiedad)}` : "",
    `📅 Fecha cierre: ${escaparHtml(d.fechaCierre)}`,
    `🧑‍💼 Asesor captador: ${escaparHtml(d.asesorCaptadorNombre)}`,
    d.asesorCaptadorOficina
      ? `🏢 Oficina captador: ${escaparHtml(d.asesorCaptadorOficina)}`
      : "",
    d.asesorCaptadorTelefono
      ? `📞 Tel. captador: ${escaparHtml(d.asesorCaptadorTelefono)}`
      : "",
    `🤝 Asesor colocador: ${escaparHtml(d.asesorColocadorNombre)}`,
    d.asesorColocadorOficina
      ? `🏢 Oficina colocador: ${escaparHtml(d.asesorColocadorOficina)}`
      : "",
    d.asesorColocadorTelefono
      ? `📞 Tel. colocador: ${escaparHtml(d.asesorColocadorTelefono)}`
      : "",
    `📍 Dirección: ${escaparHtml(d.direccionInmueble)}`,
    `🏷️ Tipo: ${escaparHtml(d.tipoTransaccion)}`,
    `💰 Monto transacción: ${escaparHtml(formatoBs(d.montoTransaccion ?? 0))}`,
    `📊 Comisión base: ${escaparHtml(
      formatoBs(
        ((d.montoTransaccion ?? 0) * (d.porcentajeBaseComision ?? 0)) / 100,
      ),
    )} (${escaparHtml(d.porcentajeBaseComision ?? 0)}%)`,
    `🏢 Oficina nacional (${escaparHtml(d.porcentajeOficinaNacionalAplicado ?? 0)}%): ${escaparHtml(
      formatoBs(d.montoPagoOficinaNacional ?? 0),
    )}`,
    `🏬 Oficina local (${escaparHtml(d.porcentajeOficinaLocalAplicado ?? 0)}%): ${escaparHtml(
      formatoBs(d.montoPagoOficinaLocal ?? 0),
    )}`,
    `💵 Comisión registrada: ${escaparHtml(formatoBs(d.montoComision ?? 0))}`,
    `👤 Pago real asesor (${escaparHtml(d.porcentajeCategoriaAplicado ?? 0)}%): ${escaparHtml(
      formatoBs(d.montoPagoRealAsesor ?? 0),
    )}`,
    `👤 Propietario: ${escaparHtml(d.nombrePropietario)} (${escaparHtml(d.telPropietario)})`,
    `👤 Cliente: ${escaparHtml(d.nombreCliente)} (${escaparHtml(d.telCliente)})`,
    `🔒 Exclusiva: ${d.exclusiva ? "Sí" : "No"}`,
    d.comprobantePagoFileId
      ? "📸 Comprobante de pago: Recibido"
      : "📸 Comprobante de pago: Pendiente",
    "",
    "Si los datos son correctos, presiona <b>Guardar cierre</b>. Si detectas un error, presiona <b>Cancelar y empezar de nuevo</b>.",
  ]
    .filter(Boolean)
    .join("\n");

  await ctx.reply(resumen, {
    parse_mode: "HTML",
    reply_markup: tecladoConfirmacionFinal,
  });
}

bot.catch((err) => {
  console.error("Error no controlado en el bot de Telegram:", err);
});
