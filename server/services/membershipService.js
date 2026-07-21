function calculateExpiryDate() {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 1);
  return now.toISOString().split('T')[0];
}

function generateMembershipId() {
  const { v4: uuidv4 } = require('uuid');
  const prefix = 'YNC-MEM-';
  const random = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}${random}`;
}

function getMemberBenefits() {
  return JSON.stringify([
    { title: 'Priority Event Registration', description: 'Get early access to event registrations before general public' },
    { title: 'Member Discounts', description: 'Exclusive discounts on all YNC events and merchandise' },
    { title: 'Community Access', description: 'Access to exclusive member-only community channels and groups' },
    { title: 'Certificate of Membership', description: 'Official YNC membership certificate' },
    { title: 'Networking Opportunities', description: 'Connect with industry professionals and fellow members' },
    { title: 'Workshop Access', description: 'Free access to all YNC workshops and skill-building sessions' },
  ]);
}

module.exports = {
  calculateExpiryDate,
  generateMembershipId,
  getMemberBenefits,
};
