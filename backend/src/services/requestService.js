const db = require('../config/db');

exports.createRequest = async (data) => {
  const [result] = await db.execute(
    `INSERT INTO requests 
    (user_id, service_type, pharmacy_name, address, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.serviceType,
      data.pharmacyName,
      data.address,
      data.lat,
      data.lng,
    ]
  );

  return result;
};

exports.getRequestByUserId = async (userId) => {
  const [rows] = await db.execute(
    'SELECT * FROM requests WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

exports.updateRequestByUserId = async (data) => {
  const [result] = await db.execute(
    `UPDATE requests SET
      service_type = ?,
      pharmacy_name = ?,
      address = ?,
      lat = ?,
      lng = ?
    WHERE user_id = ?`,
    [
      data.serviceType,
      data.pharmacyName,
      data.address,
      data.lat,
      data.lng,
      data.userId,
    ]
  );

  return result;
};