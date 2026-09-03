// Add any client recipe or feedback image to src/Assets/Community,
// import it here, then add one object to the communitySlides array.
//
// Example:
// import recipe1 from "../Assets/Community/recipe1.jpg";
//
// {
//   id: 1,
//   image: recipe1,
//   type: "Recipe",
//   title: "Peanut Butter Pancakes",
//   text: "Made with Golden Spreads Creamy",
//   fit: "cover", // use "contain" for screenshots so text is not cropped
// }

// Temporary examples using images already in the project.
// Replace these with your real client photos whenever you are ready.
import feedback1 from "../Assets/Community/feedback1.jpg";
import feedback2 from "../Assets/Community/feedback2.jpg";
import feedback3 from "../Assets/Community/feedback3.png";
import feedback4 from "../Assets/Community/feedback4.png";
import feedback5 from "../Assets/Community/feedback5.png";
import feedback6 from "../Assets/Community/feedback6.jpg";
import recipe1 from "../Assets/Community/recipe1.jpg";
import recipe2 from "../Assets/Community/recipe2.jpg";

const communitySlides = [
  {
    id: 8,
    image: recipe2,
    type: "Recipe",
    title: "Customer Favorites",
    text: "Discover the recipes our customers love most.",
  },
  {
    id: 1,
    image: feedback1,
    type: "Feedback",
    title: "Your Client Recipe",
    text: "Replace this sample with a customer recipe photo.",
  },
  {
    id: 2,
    image: feedback2,
    type: "Feedback",
    title: "Client Feedback",
    text: "Add screenshots or photos of real customer feedback here.",
  },
  {
    id: 3,
    image: feedback3,
    type: "Feedback",
    title: "Serving Ideas",
    text: "Show how your clients use Golden Spreads.",
  },
  {
    id: 7,
    image: recipe1,
    type: "Recipe",
    title: "Community Creations",
    text: "Showcase customer-made dishes using Golden Spreads.",
  },
  {
    id: 4,
    image: feedback4,
    type: "Feedback",
    title: "Golden Community",
    text: "Share customer moments, reviews, and creations.",
  },
  {
    id: 5,
    image: feedback5,
    type: "Feedback",
    title: "Customer Testimonials",
    text: "Hear from our satisfied customers about their experience with Golden Spreads.",
  },
  {
    id: 6,
    image: feedback6,
    type: "Feedback",
    title: "Customer Love",
    text: "See what our customers are saying about Golden Spreads.",
  },
  
  
];

export default communitySlides;
