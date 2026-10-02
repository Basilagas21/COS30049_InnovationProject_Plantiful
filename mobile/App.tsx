import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  deleteTestRecords,
  getTestRecords,
  insertTestRecord,
  openDatabase,
  type TestRecord,
} from './src/db';

export default function App() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [message, setMessage] = useState('Database not opened yet');

  async function refresh() {
    const db = await openDatabase();
    const rows = await getTestRecords(db);
    setRecords(rows);
    setMessage(`SQLite ready. ${rows.length} test record(s) read back.`);
  }

  async function addRecord() {
    const db = await openDatabase();
    await insertTestRecord(db);
    await refresh();
  }

  async function clearRecords() {
    const db = await openDatabase();
    await deleteTestRecords(db);
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello Plantiful</Text>
      <Text style={styles.status}>{message}</Text>

      {records.map((record) => (
        <View key={record.id} style={styles.record}>
          <Text style={styles.recordName}>{record.species_name}</Text>
          <Text style={styles.recordMeta}>ID: {record.id}</Text>
          <Text style={styles.recordMeta}>Captured: {record.capture_ts}</Text>
          <Text style={styles.recordMeta}>Sync: {record.sync_status}</Text>
        </View>
      ))}

      <View style={styles.buttons}>
        <Button title="Insert test record" onPress={addRecord} />
        <Button title="Clear test records" onPress={clearRecords} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  record: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  recordMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
});