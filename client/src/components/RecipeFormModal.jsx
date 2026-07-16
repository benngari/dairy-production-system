import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const UNITS = ['Liters', 'Kilograms', 'Grams', 'Milliliters'];

const RecipeFormModal = ({ isOpen, recipe, onClose, onSaved }) => {
  const isEdit = !!recipe;
  const toast = useToast();
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: recipe?.name || '',
      description: recipe?.description || '',
      category: recipe?.category || 'General',
      yieldPercentage: recipe?.yieldPercentage ?? 100,
      status: recipe?.status || 'Active',
      ingredients:
        recipe?.ingredients?.map((i) => ({
          ingredient: i.ingredient?._id || i.ingredient,
          percentage: i.percentage,
          unit: i.unit,
        })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const watchedIngredients = watch('ingredients');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const { data } = await api.get('/ingredients');
        setIngredientOptions(data.ingredients);
      } catch (err) {
        toast.error('Failed to load ingredient list');
      }
    };
    loadIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPercentage = (watchedIngredients || []).reduce(
    (sum, i) => sum + (Number(i?.percentage) || 0),
    0
  );

  const onIngredientSelect = (index, ingredientId) => {
    const master = ingredientOptions.find((i) => i._id === ingredientId);
    if (master) {
      // auto-fill unit from the master ingredient's default unit
      setValue(`ingredients.${index}.unit`, master.unit);
    }
  };

  const onSubmit = async (values) => {
    if (!values.ingredients || values.ingredients.length === 0) {
      toast.error('At least one ingredient is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        yieldPercentage: Number(values.yieldPercentage),
        ingredients: values.ingredients.map((i) => ({
          ingredient: i.ingredient,
          percentage: Number(i.percentage),
          unit: i.unit,
        })),
      };

      if (isEdit) {
        await api.put(`/recipes/${recipe._id}`, payload);
        toast.success('Recipe updated successfully');
      } else {
        await api.post('/recipes', payload);
        toast.success('Recipe created successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Recipe' : 'Create New Recipe'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Recipe Name</label>
            <input className="input" placeholder="e.g. Flavored Yogurt" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="Short description" {...register('description')} />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="e.g. Yogurt, Cheese, Ice Cream" {...register('category')} />
          </div>
          <div>
            <label className="label">Yield %</label>
            <input
              type="number"
              step="0.01"
              className="input"
              {...register('yieldPercentage', { required: true, min: 0 })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">
              Ingredients{' '}
              <span className={`ml-2 text-xs font-normal ${totalPercentage > 100 ? 'text-red-500' : 'text-slate-400'}`}>
                (Total: {totalPercentage.toFixed(2)}% of milk quantity)
              </span>
            </label>
            <button
              type="button"
              className="btn-outline !py-1.5 !px-3 text-xs"
              onClick={() => append({ ingredient: '', percentage: '', unit: 'Kilograms' })}
            >
              <FiPlus size={14} /> Add Ingredient
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {fields.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                No ingredients added yet. Click "Add Ingredient" to start building this recipe.
              </p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start bg-slate-50 rounded-lg p-2.5">
                <select
                  className="input flex-1"
                  defaultValue={field.ingredient}
                  {...register(`ingredients.${index}.ingredient`, { required: true })}
                  onChange={(e) => onIngredientSelect(index, e.target.value)}
                >
                  <option value="">Select ingredient...</option>
                  {ingredientOptions.map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {opt.name} ({opt.category})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="%"
                  className="input w-24"
                  {...register(`ingredients.${index}.percentage`, { required: true, min: 0 })}
                />
                <select className="input w-32" {...register(`ingredients.${index}.unit`, { required: true })}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-ghost !px-2 text-red-500" onClick={() => remove(index)}>
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Ingredients are unavailable? Add them first from the Inventory page, then return here to build the recipe.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecipeFormModal;
