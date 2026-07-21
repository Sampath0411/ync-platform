const { v4: uuidv4 } = require('uuid');

function generateTicketNumber() {
  const prefix = 'YNC-TKT-';
  const random = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}-${random}`;
}

function generateQRCodeData(ticketData) {
  const payload = {
    t: ticketData.ticket_number,
    e: ticketData.event_id,
    u: ticketData.user_id,
    ts: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

function generateBarcodeData(ticketData) {
  return `${ticketData.ticket_number}|${ticketData.event_id}|${ticketData.user_id}`;
}

function prepareTicketData(booking, event, user) {
  const ticketNumber = generateTicketNumber();
  const ticketData = {
    ticket_number: ticketNumber,
    event_id: event.id,
    user_id: user.id,
  };

  return {
    ticketNumber,
    qrCodeData: generateQRCodeData(ticketData),
    barcodeData: generateBarcodeData(ticketData),
  };
}

module.exports = {
  generateTicketNumber,
  generateQRCodeData,
  generateBarcodeData,
  prepareTicketData,
};
