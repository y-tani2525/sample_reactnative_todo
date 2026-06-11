import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export const TodoList = ({ todos, onToggle, onDelete }: Props) => {
  if (todos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Todoがありません</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={todos}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TodoItem todo={item} onToggle={onToggle} onDelete={onDelete} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
  },
});
