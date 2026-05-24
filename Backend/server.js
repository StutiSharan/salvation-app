const app = require("./app");

const PORT = process.env.PORT || 7007;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
