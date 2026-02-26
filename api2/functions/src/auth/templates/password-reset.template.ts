export function buildPasswordResetEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Recuperar Senha — Nova Era</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .inner-body { padding: 32px 24px !important; }
      .hero-title { font-size: 22px !important; }
      .cta-btn { padding: 14px 32px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">

  <!-- Background wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" class="email-container" style="max-width:560px; width:100%;">

          <!-- ═══════ TOP ACCENT BAR ═══════ -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #f06314, #d14e0a, #f06314); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- ═══════ HEADER / LOGO ═══════ -->
          <tr>
            <td align="center" style="background-color:#ffffff; padding:32px 40px 24px; border-left:1px solid #e8eaed; border-right:1px solid #e8eaed;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="padding-right:12px;">
                    <!-- Logo icon (SVG as inline) -->
                    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                      <circle cx="50" cy="50" r="44" stroke="#f06314" stroke-width="5"/>
                      <circle cx="50" cy="50" r="19" fill="#f06314"/>
                    </svg>
                  </td>
                  <td valign="middle">
                    <span style="font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#111111; text-decoration:none; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                      NOVA <span style="color:#f06314;">ERA</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════ DIVIDER ═══════ -->
          <tr>
            <td style="background-color:#ffffff; padding:0 40px; border-left:1px solid #e8eaed; border-right:1px solid #e8eaed;">
              <div style="height:2px; background:linear-gradient(90deg, transparent, #f06314, transparent);"></div>
            </td>
          </tr>

          <!-- ═══════ BODY ═══════ -->
          <tr>
            <td class="inner-body" style="background-color:#ffffff; padding:40px 40px 20px; border-left:1px solid #e8eaed; border-right:1px solid #e8eaed;">

              <!-- Icon lock -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:68px; height:68px; background-color:#f8f9fa; border:2px solid #e8eaed; display:inline-flex; align-items:center; justify-content:center;">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f06314" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        <circle cx="12" cy="16" r="1"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 class="hero-title" style="margin:0; font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:0.08em; color:#111111; line-height:1.2; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                      Recuperar <span style="color:#f06314;">Senha</span>
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <span style="display:inline-block; background:#f06314; color:#ffffff; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; padding:4px 16px;">
                      SOLICITAÇÃO DE REDEFINIÇÃO
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:15px; line-height:1.7; color:#3c4043; font-weight:500; padding-bottom:20px; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    Olá, <strong style="color:#202124;">Jogador</strong>!
                  </td>
                </tr>
                <tr>
                  <td style="font-size:15px; line-height:1.7; color:#3c4043; font-weight:500; padding-bottom:24px; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    Recebemos uma solicitação para redefinir a senha da sua conta na <strong style="color:#202124;">Nova Era</strong>. Clique no botão abaixo para criar uma nova senha e voltar à arena.
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:52px;v-text-anchor:middle;width:280px;" fill="true" stroke="f">
                      <v:fill type="gradient" color="#f06314" color2="#d14e0a" angle="135"/>
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:'Segoe UI',sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;">REDEFINIR SENHA</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetUrl}" target="_blank" class="cta-btn" style="display:inline-block; background:linear-gradient(135deg, #f06314 0%, #d14e0a 100%); color:#ffffff; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; text-decoration:none; padding:16px 48px; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif; box-shadow:0 4px 20px rgba(240,99,20,0.35); mso-padding-alt:0;">
                      REDEFINIR SENHA
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Expiry notice  -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 0 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:4px solid #fbbc04; background:rgba(251,188,4,0.1);">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0 0 2px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#8a6d00; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                            ⚠ Atenção
                          </p>
                          <p style="margin:0; font-size:13px; line-height:1.5; color:#8a6d00; font-weight:500; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                            Este link expira em <strong>1 hora</strong>. Se não for você quem solicitou, ignore este e-mail com segurança.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 6px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#5f6368; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                      Botão não funcionou?
                    </p>
                    <p style="margin:0; font-size:13px; line-height:1.5; color:#5f6368; font-weight:500; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                      Copie e cole o link abaixo no seu navegador:
                    </p>
                    <p style="margin:8px 0 0; padding:12px 16px; background:#f8f9fa; border:1px solid #e8eaed; font-size:12px; word-break:break-all; color:#f06314; font-family:'Fira Code','Consolas',monospace; line-height:1.5;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══════ SECURITY TIPS ═══════ -->
          <tr>
            <td style="background-color:#ffffff; padding:0 40px 36px; border-left:1px solid #e8eaed; border-right:1px solid #e8eaed;">
              <div style="height:1px; background-color:#e8eaed; margin-bottom:28px;"></div>

              <p style="margin:0 0 14px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:#9aa0a6; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                Dicas de segurança
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f06314" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </td>
                  <td style="font-size:13px; line-height:1.6; color:#5f6368; font-weight:500; padding-bottom:8px; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    Nunca compartilhe sua senha ou este link com ninguém.
                  </td>
                </tr>
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f06314" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </td>
                  <td style="font-size:13px; line-height:1.6; color:#5f6368; font-weight:500; padding-bottom:8px; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    Use uma senha forte com letras, números e caracteres especiais.
                  </td>
                </tr>
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f06314" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </td>
                  <td style="font-size:13px; line-height:1.6; color:#5f6368; font-weight:500; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    Nossa equipe nunca pedirá sua senha por e-mail.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════ FOOTER DIVIDER ═══════ -->
          <tr>
            <td style="background-color:#ffffff; padding:0 40px; border-left:1px solid #e8eaed; border-right:1px solid #e8eaed;">
              <div style="height:2px; background:linear-gradient(90deg, transparent, #f06314, transparent);"></div>
            </td>
          </tr>

          <!-- ═══════ FOOTER ═══════ -->
          <tr>
            <td style="background-color:#ffffff; padding:28px 40px 32px; border-left:1px solid #e8eaed; border-right:1px solid #e8eaed; border-bottom:1px solid #e8eaed;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <!-- Footer logo -->
                    <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="44" stroke="#9aa0a6" stroke-width="4"/>
                      <circle cx="50" cy="50" r="19" fill="#9aa0a6"/>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:12px; color:#9aa0a6; font-weight:600; line-height:1.7; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    <span style="font-weight:800; text-transform:uppercase; letter-spacing:0.1em; font-size:11px;">Nova Era</span> · Temporada 2025
                    <br>
                    Este é um e-mail automático. Por favor, não responda.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <a href="#" style="display:inline-block; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:#f06314; text-decoration:none; padding:6px 14px; border:1.5px solid #f06314; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                      Precisa de ajuda?
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:20px; font-size:11px; color:#dadce0; font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;">
                    © 2025 Nova Era. Todos os direitos reservados.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════ BOTTOM ACCENT BAR ═══════ -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #f06314, #d14e0a, #f06314); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

        </table><!-- end email container -->

      </td>
    </tr>
  </table><!-- end background wrapper -->

</body>
</html>`;
}
