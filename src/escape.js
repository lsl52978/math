const ESC = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

export default (str = "") => String(str).replace(/[&<>"]/g, (m) => ESC[m]);
