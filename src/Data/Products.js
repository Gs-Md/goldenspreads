import creamy from "../Assets/creamy.jpg";
import crunchy from "../Assets/crunchy.jpg";
import cocoa from "../Assets/cocoa.jpg";
import dates from "../Assets/dates.jpg";
import protein from "../Assets/protein.jpg";
import comingSoon from "../Assets/comingsoon.jpg";

const products = [
  {
    id: 1,
    name: "Classic Peanut Butter",
    price: "$4.00",
    weight: "300 g",
    image: creamy,
    ingredients: "Roasted peanuts",
    info: ["No Added Sugars", "Gluten Free", "Keto Friendly","Organic"],
    bestUse: "Toast, Smoothies, Apple slices, Banana sandwiches Baking, OatMeals.",
  },
  {
    id: 2,
    name: "Crunchy Peanut Butter",
    price: "$4.00",
    weight: "300 g",
    image: comingSoon,
    ingredients: "Roasted peanuts, Peanut pieces",
    info: ["No Added Sugars", "Gluten Free", "Keto Friendly","Organic"],
    bestUse: "Toast, Yogurt bowls, Apple slices, Banana sandwiches, OatMeals.",
  },
  {
    id: 3,
    name: "Cocoa Peanut Butter",
    price: "$6.00",
    weight: "300 g",
    image: comingSoon,
    ingredients: "Peanuts, Cocoa powder",
    info: ["Palm Oil Free", "Gluten Free", "No Added Sugars", "No Preservatives"],
    bestUse: "Toast, Pancake, Apple slices, Banana sandwiches, Smoothies, OatMeals.",
  },
  {
    id: 4,
        featured: true,

    name: "Dates Peanut Butter",
    price: "$6.00",
    weight: "300 g",
    image: comingSoon,
    ingredients: "Peanuts, Dates",
    info: ["Organic", "Naturally Sweetened", "Gluten Free","Natural Energy Booster"],
    bestUse: "Toast, Pancake,Yogurt Bowls, Energy Balls, Smoothies, OatMeals.",
  },
  {
    id: 5,
    name: "Protein Powder Peanut Butter",
    price: "$8.00",
    weight: "300 g",
    image: comingSoon,
    ingredients: "Peanuts, whey protein",
    info: ["High Protein (130g)", "Palm Oil Free", "No Preservatives","Natural Energy Booster"],
    bestUse: "Smoothies, OatMeals, Protein shakes, Waffles, Pancakes, Rice Cake.",
  },
];

export default products;