const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

module.exports = async (req, res) => {
  const { userId, title, body, apiKey } = req.query;
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).send("Clé API invalide");
  }
  if (!userId) {
    return res.status(400).send("userId requis");
  }
  try {
    const userDoc = await admin.firestore()
        .collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).send("Utilisateur non trouvé");
    }
    const token = userDoc.data().fcmToken;
    if (!token) {
      return res.status(400).send("Token FCM manquant");
    }
    const message = {
      notification: {
        title: title || "Notification par défaut",
        body: body || "Contenu par défaut"
      },
      data: {
        taskId: "exemple_task_id",
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },
      token: token
    };
    const response = await admin.messaging().send(message);
    console.log("Notification envoyée avec succès :", response);
    res.status(200).send(`Notification envoyée à ${userId} : ${title}`);
  } catch (error) {
    console.error("Erreur envoi notif :", error);
    res.status(500).send("Erreur serveur : " + error.message);
  }
};
