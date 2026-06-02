import { useState } from "react";

interface TodoItem {
  id: number;
  name: string;
}

export default function TodoApp() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [input, setInput] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number>(1);

  const handleAddOrUpdate = () => {
    if (!input.trim()) return;
    if (editId !== null) {
      // Update existing
      setItems((prev) =>
        prev.map((item) =>
          item.id === editId ? { ...item, name: input } : item
        )
      );
      setEditId(null);
    } else {
      // Add new
      setItems((prev) => [...prev, { id: nextId, name: input }]);
      setNextId((id) => id + 1);
    }
    setInput("");
  };

  const handleEdit = (item: TodoItem) => {
    setInput(item.name);
    setEditId(item.id);
  };

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editId === id) {
      setEditId(null);
      setInput("");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Todo List</h1>
      <div className="flex space-x-2 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter todo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleAddOrUpdate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded"
        >
          {editId !== null ? "Update" : "Add"}
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>{item.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(item)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
