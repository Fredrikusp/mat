// script.js
// This file contains the client‑side logic for the Kitchen Ingredient Recipe Finder.
// It loads a pre‑trained MobileNet model, classifies the uploaded image to detect
// ingredients and then fetches corresponding recipes from TheMealDB API.

// Wait for the DOM to be fully loaded before running any code.
document.addEventListener('DOMContentLoaded', () => {
  const imageUpload = document.getElementById('imageUpload');
  const previewImage = document.getElementById('preview-image');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const ingredientList = document.getElementById('ingredient-list');
  const recipesContainer = document.getElementById('recipes');

  let model;

  // Mapping between MobileNet labels and simplified ingredient names.
  // Only a handful of common foods are mapped here; feel free to extend the list.
  const ingredientMap = {
    'banana': 'banana',
    'Granny Smith': 'apple',
    'strawberry': 'strawberry',
    'orange': 'orange',
    'lemon': 'lemon',
    'pineapple': 'pineapple',
    'cucumber': 'cucumber',
    'carrot': 'carrot',
    'broccoli': 'broccoli',
    'cauliflower': 'cauliflower',
    'bell pepper': 'pepper',
    'chili pepper': 'pepper',
    'jalapeno': 'pepper',
    'potato': 'potato',
    'cabbage': 'cabbage',
    'lettuce': 'lettuce',
    'mushroom': 'mushroom',
    'garlic': 'garlic',
    'ginger': 'ginger',
    'onion': 'onion',
    'egg': 'egg',
    'bagel': 'bread',
    'pretzel': 'bread',
    'dough': 'bread',
    'pizza': 'pizza',
    'bacon': 'bacon',
    'hotdog': 'hot dog',
    'hamburger': 'beef',
    'cheeseburger': 'beef'
  };

  // Load the MobileNet model asynchronously.
  async function loadModel() {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Loading model...';
    model = await mobilenet.load();
    analyzeBtn.textContent = 'Analyze Ingredients';
    analyzeBtn.disabled = false;
    console.log('Model loaded');
  }

  // Display the selected image in the preview container.
  imageUpload.addEventListener('change', () => {
    const file = imageUpload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // Handle the click event to analyze the uploaded image.
  analyzeBtn.addEventListener('click', async () => {
    if (!model) {
      alert('Model not loaded yet, please wait.');
      return;
    }
    const file = imageUpload.files[0];
    if (!file) {
      alert('Please upload an image first.');
      return;
    }
    // Clear previous results.
    ingredientList.innerHTML = '';
    recipesContainer.innerHTML = '';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    // Create an image element for classification.
    const img = new Image();
    img.src = previewImage.src;
    img.onload = async () => {
      // Use MobileNet to classify the image. It returns an array of predictions.
      const predictions = await model.classify(img);
      // Extract recognised ingredients based on mapping and confidence threshold.
      const recognised = new Set();
      predictions.forEach(pred => {
        const name = pred.className;
        // Some MobileNet labels have multiple names separated by commas.
        const parts = name.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (ingredientMap[trimmed] && pred.probability > 0.20) {
            recognised.add(ingredientMap[trimmed]);
          }
        }
      });
      if (recognised.size === 0) {
        ingredientList.innerHTML = '<li>No recognizable ingredients found.</li>';
        analyzeBtn.textContent = 'Analyze Ingredients';
        analyzeBtn.disabled = false;
        return;
      }
      // Display ingredients and fetch recipes.
      recognised.forEach(async (ingredient) => {
        const li = document.createElement('li');
        li.textContent = ingredient;
        ingredientList.appendChild(li);
        await fetchRecipes(ingredient);
      });
      analyzeBtn.textContent = 'Analyze Ingredients';
      analyzeBtn.disabled = false;
    };
  });

  // Fetch recipes from TheMealDB API for a given ingredient.
  async function fetchRecipes(ingredient) {
    try {
      const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      if (!data.meals) {
        console.log(`No recipes found for ${ingredient}.`);
        return;
      }
      // Show up to 3 recipes for each ingredient to avoid overwhelming the page.
      data.meals.slice(0, 3).forEach(meal => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        const img = document.createElement('img');
        img.src = meal.strMealThumb;
        img.alt = meal.strMeal;
        const info = document.createElement('div');
        info.className = 'recipe-info';
        const title = document.createElement('h3');
        title.textContent = meal.strMeal;
        const link = document.createElement('a');
        link.href = `https://www.themealdb.com/meal.php?c=${meal.idMeal}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'View recipe';
        info.appendChild(title);
        info.appendChild(link);
        card.appendChild(img);
        card.appendChild(info);
        recipesContainer.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  }

  // Kick off model loading when the page loads.
  loadModel().catch(err => console.error(err));
});