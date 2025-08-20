import express from 'express';
const router = express.Router();

router.post('/updateToken', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Save or update the token in your DB
    // For example:
    // await saveOrUpdateDeviceToken(token);
    console.log("Received new token:", token);

    return res.json({ message: "Token updated successfully" });
  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
