exports.pageNotFound = (req, res) => {
  // Instead of res.render("404"), we send a JSON object
  res.status(404).json({ 
    message: "Page Not Found", 
    pageTitle: "Page Not Found",
    currentPage: "404" 
  });
};