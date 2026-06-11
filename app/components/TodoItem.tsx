import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Todo } from '../types/todo';

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export const TodoItem = ({ todo, onToggle, onDelete }: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.left} onPress={() => onToggle(todo.id)}>
        <View style={[styles.checkbox, todo.completed && styles.checkboxDone]} />
        <Text style={[styles.text, todo.completed && styles.textDone]}>
          {todo.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(todo.id)}>
        <Text style={styles.deleteButton}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#aaa',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  text: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteButton: {
    fontSize: 16,
    color: '#ccc',
    paddingLeft: 12,
  },
});
