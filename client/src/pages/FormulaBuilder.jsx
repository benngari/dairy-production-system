import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const FormulaBuilder = () => {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', ingredients: [] });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
  }, []);

  const fetchRecipes = async () => {
    const res = await api.get('/recipes');
    setRecipes(res.data);
  };
  const fetchIngredients = async () => {
    const res = await api.get('/ingredients');
    setIngredients(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/recipes/${editing}`, form);
        toast.success('Recipe updated');
      } else {
        await api.post('/recipes', form);
        toast.success('Recipe created');
      }
      fetchRecipes();
      setForm({ name: '', description: '', ingredients: [] });
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDuplicate = async (id) => {
    await api.post(`/recipes/${id}/duplicate`);
    fetchRecipes();
    toast.success('Duplicated');
  };

  const handleToggle = async (id) => {
    await api.patch(`/recipes/${id}/toggle`);
    fetchRecipes();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) {
      await api.delete(`/recipes/${id}`);
      fetchRecipes();
      toast.success('Deleted');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Formula Builder</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Recipe Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border p-2 rounded"
          />
        </div>
        <div className="mt-4">
          <h4 className="font-semibold">Ingredients (% of milk)</h4>
          {form.ingredients.map((item, idx) => (
            <div key={idx} className="flex space-x-2 mt-2">
              <select
                value={item.ingredientId || ''}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients];
                  newIngredients[idx].ingredientId = e.target.value;
                  setForm({ ...form, ingredients: newIngredients });
                }}
                className="border p-1 rounded"
              >
                <option value="">Select</option>
                {ingredients.map(ing => (
                  <option key={ing._id} value={ing._id}>{ing.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="%"
                value={item.percentage || ''}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients];
                  newIngredients[idx].percentage = parseFloat(e.target.value);
                  setForm({ ...form, ingredients: newIngredients });
                }}
                className="border p-1 rounded w-20"
                step="0.1"
              />
              <button
                type="button"
                onClick={() => {
                  const newIngredients = form.ingredients.filter((_, i) => i !== idx);
                  setForm({ ...form, ingredients: newIngredients });
                }}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, ingredients: [...form.ingredients, { ingredientId: '', percentage: 0 }] })}
            className="text-blue-600 mt-2"
          >
            + Add Ingredient
          </button>
        </div>
        <button type="submit" className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
          {editing ? 'Update' : 'Create'} Recipe
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', ingredients: [] }); }} className="ml-2 text-gray-600">
            Cancel
          </button>
        )}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map(recipe => (
          <div key={recipe._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{recipe.name}</h3>
            <p className="text-sm text-gray-600">{recipe.description}</p>
            <p className="text-xs">Version {recipe.version} | {recipe.isActive ? 'Active' : 'Inactive'}</p>
            <div className="mt-2 flex space-x-2">
              <button onClick={() => { setEditing(recipe._id); setForm(recipe); }} className="text-blue-600 text-sm">Edit</button>
              <button onClick={() => handleDuplicate(recipe._id)} className="text-purple-600 text-sm">Duplicate</button>
              <button onClick={() => handleToggle(recipe._id)} className="text-yellow-600 text-sm">Toggle</button>
              <button onClick={() => handleDelete(recipe._id)} className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormulaBuilder;