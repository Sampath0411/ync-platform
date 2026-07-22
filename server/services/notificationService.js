const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('../db/firebase');

async function createNotification(userId, type, title, message) {
  const db = getFirestore();
  const id = uuidv4();
  const notification = {
    id,
    user_id: userId,
    type,
    title,
    message,
    is_read: 0,
    is_global: 0,
    created_at: new Date().toISOString(),
  };
  await db.collection('notifications').doc(id).set(notification);
  return notification;
}

async function sendGlobalNotification(type, title, message) {
  const db = getFirestore();
  const id = uuidv4();
  const notification = {
    id,
    user_id: null,
    type,
    title,
    message,
    is_global: 1,
    is_read: 0,
    created_at: new Date().toISOString(),
  };
  await db.collection('notifications').doc(id).set(notification);
  return notification;
}

function sendMembershipNotification(userId, status, adminNotes) {
  let title, message;

  switch (status) {
    case 'approved':
      title = 'Membership Approved';
      message = 'Congratulations! Your YNC membership request has been approved. Welcome to the community!';
      break;
    case 'rejected':
      title = 'Membership Rejected';
      message = adminNotes
        ? `Your membership request was rejected. Reason: ${adminNotes}`
        : 'Your membership request has been rejected. Please contact support for more information.';
      break;
    case 'returned':
      title = 'Membership Request Returned';
      message = adminNotes
        ? `Your membership request needs corrections: ${adminNotes}`
        : 'Your membership request has been returned for corrections. Please update and resubmit.';
      break;
    default:
      title = 'Membership Update';
      message = 'Your membership status has been updated.';
  }

  return createNotification(userId, 'membership_approval', title, message);
}

module.exports = {
  createNotification,
  sendGlobalNotification,
  sendMembershipNotification,
};
