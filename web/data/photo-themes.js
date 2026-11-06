// Background photo themes. Each theme draws at random from Wikimedia Commons categories, so every photo
// is freely licensed and comes with its own caption, author and license (shown on screen).
window.PHOTO_THEMES = {
  uae: {
    name: { ar: "الإمارات", en: "UAE" },
    categories: [
      "Category:Quality images of Dubai",
      "Category:Quality images of Abu Dhabi",
      "Category:Quality images of Sharjah",
      "Category:Featured pictures of Dubai",
      "Category:Featured pictures of the United Arab Emirates"
    ]
  },
  cars: {
    name: { ar: "سيارات", en: "Cars" },
    categories: ["Category:Featured pictures of automobiles", "Category:Quality images of automobiles"]
  },
  nature: {
    name: { ar: "طبيعة من العالم", en: "World nature" },
    categories: ["Category:Featured pictures of landscapes"]
  },
  player: {
    name: { ar: "كريستيانو رونالدو", en: "Cristiano Ronaldo" },
    categories: ["Category:Cristiano Ronaldo"]
  }
};
