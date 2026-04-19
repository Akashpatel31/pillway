const requestService = require("../services/requestService");

exports.createRequest = async (req, res) => {
  try {

    const { userId, serviceType, pharmacy } = req.body;

    if (!userId || !serviceType || !pharmacy?.address) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const data = {
      userId,
      serviceType,
      pharmacyName: pharmacy.name || "Unknown",
      address: pharmacy.address,
      lat: Number(pharmacy.lat) || 0,
      lng: Number(pharmacy.lng) || 0,
    };

    const existing = await requestService.getRequestByUserId(userId);

    if (existing) {
      await requestService.updateRequestByUserId(data);
      return res.status(200).json({
        message: "Request updated",
        id: existing.id,
        updated: true,
      });
    }

    const result = await requestService.createRequest(data);

    res.status(201).json({
      message: "Request created",
      id: result.insertId,
      updated: false,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getRequestByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const request = await requestService.getRequestByUserId(Number(userId));

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};