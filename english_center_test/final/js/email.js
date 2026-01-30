// ===============================
// EmailJS configuration
// ===============================
const EMAIL_CONFIG = {
  publicKey: 'WigxmHbh5AgE-p_0I',
  serviceId: 'service_4sj8y7r',
  templateId: 'template_3nz97h4',
  recipientEmail: 'test@englishcenter.mx'
};

// ===============================
// Inicializar EmailJS
// ===============================
(function () {
  if (typeof emailjs === 'undefined') {
    console.error('EmailJS no está cargado. Revisa que el script de EmailJS esté incluido.');
    return;
  }

  emailjs.init(EMAIL_CONFIG.publicKey);
})();

// ===============================
// Enviar resultados por email
// ===============================
function sendResultsEmail(results) {
  if (!results) {
    console.error('No se recibieron resultados para enviar por email.');
    return;
  }

  const templateParams = {
    to_email: EMAIL_CONFIG.recipientEmail,
    user_name: results.userName || 'No especificado',
    user_email: results.userEmail || 'No especificado',
    user_phone: results.userPhone || 'No especificado',
    final_level: results.finalLevel || 'No determinado',
    level_description: results.levelDescription || '',
    overall_score: results.overallScore || '',
    level_breakdown: results.levelBreakdown || '',
    test_date: results.testDate || new Date().toLocaleString()
  };

  emailjs
    .send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      templateParams
    )
    .then(function (response) {
      console.log('✅ Email enviado correctamente:', response.status, response.text);
    })
    .catch(function (error) {
      console.error('❌ Error al enviar el email:', error);
    });
}

