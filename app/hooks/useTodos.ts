import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Todo } from '../types/todo';

const STORAGE_KEY = '@todos';

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setTodos(JSON.parse(json));
    } catch (e) {
      console.error('Failed to load todos', e);
    }
  };

  const save = async (updated: Todo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save todos', e);
    }
  };

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    const updated = [...todos, newTodo];
    setTodos(updated);
    save(updated);
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updated);
    save(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(todo => todo.id !== id);
    setTodos(updated);
    save(updated);
  };

  return { todos, addTodo, toggleTodo, deleteTodo };
};
