// Variables requises au chargement de certains modules (ex. services/auth.ts
// exige JWT_SECRET dès l'import) — doit tourner avant que les fichiers de
// test importent le code applicatif.
process.env.JWT_SECRET ??= "test-secret";
process.env.REMINDER_AFTER_DAYS ??= "7";
process.env.REMINDER_INTERVAL_DAYS ??= "7";
