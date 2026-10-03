const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');
initializeApp();
const db = getFirestore();

exports.createDemoPayment = onCall({region:'asia-south1'}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in required.');
  const { recipient, amount, note='' } = request.data || {};
  const value = Number(amount);
  if (!recipient || !Number.isFinite(value) || value <= 0 || value > 100000) {
    throw new HttpsError('invalid-argument','Invalid recipient or amount.');
  }
  const uid = request.auth.uid;
  await db.collection('users').doc(uid).collection('transactions').add({
    counterparty:String(recipient).slice(0,100), direction:'out', amount:value,
    note:String(note).slice(0,200), status:'Success', createdAt:FieldValue.serverTimestamp()
  });
  return {ok:true};
});
