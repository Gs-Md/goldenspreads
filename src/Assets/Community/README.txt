Put your client recipe and feedback images in this folder.

Then open:
  src/Data/CommunitySlides.js

1. Import the image, for example:
   import pancakes from "../Assets/Community/pancakes.jpg";

2. Add a slide object:
   {
     id: 6,
     image: pancakes,
     type: "Recipe",
     title: "Protein Pancakes",
     text: "Made with Golden Spreads Creamy",
     fit: "cover",
   }

You can use type: "Recipe", "Feedback", or any label you want.
Title and text are optional.

For WhatsApp/Instagram feedback screenshots, add:
   fit: "contain"
so the full screenshot and its text stay visible instead of being cropped.
