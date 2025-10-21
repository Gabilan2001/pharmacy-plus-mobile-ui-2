import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Pencil } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Coupon = {
  id: string;
  code: string;
  minAmount: number;
  discountAmount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
};

export default function CouponsPage() {
  const { apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [minAmount, setMinAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiRequest('GET', '/coupons');
      setCoupons(list);
    } catch (e) {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setMinAmount('');
    setDiscountAmount('');
    setUsageLimit('');
    setModalVisible(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setMinAmount(String(c.minAmount));
    setDiscountAmount(String(c.discountAmount));
    setUsageLimit(String(c.usageLimit));
    setModalVisible(true);
  };

  const submit = async () => {
    const body = {
      minAmount: Number(minAmount),
      discountAmount: Number(discountAmount),
      usageLimit: Number(usageLimit),
    };
    if (!body.minAmount || !body.discountAmount || !body.usageLimit) return;
    try {
      setSubmitting(true);
      if (editing) {
        const updated = await apiRequest('PUT', `/coupons/${editing.id}`, body);
        setCoupons(prev => prev.map(c => c.id === editing.id ? updated : c));
      } else {
        const created = await apiRequest('POST', '/coupons', body);
        setCoupons(prev => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiRequest('DELETE', `/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offer Codes</Text>
        <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
          <Plus size={18} color={colors.white} />
          <Text style={styles.createBtnText}>Create Code</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {coupons.map(c => (
            <View key={c.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.code}>#{c.code}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(c)}>
                    <Pencil size={16} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => remove(c.id)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.meta}>Min Spend: ${c.minAmount.toFixed(2)}</Text>
              <Text style={styles.meta}>Offer: -${c.discountAmount.toFixed(2)}</Text>
              <Text style={styles.meta}>Used: {c.usedCount} / {c.usageLimit}</Text>
              <Text style={styles.meta}>Status: {c.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          ))}
          {coupons.length === 0 && (
            <Text style={{ textAlign: 'center', color: colors.textSecondary }}>No offer codes yet</Text>
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setModalVisible(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Code' : 'Create Code'}</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Minimum Spend</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={minAmount} onChangeText={setMinAmount} />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Offer Amount</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={discountAmount} onChangeText={setDiscountAmount} />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Usage Limit</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={usageLimit} onChangeText={setUsageLimit} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={submit} disabled={submitting}>
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.btnText, { color: colors.white }]}>{editing ? 'Save' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  createBtn: { flexDirection: 'row', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: colors.white, fontWeight: '700' as const },
  content: { flex: 1, padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  code: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  iconBtn: { padding: 6, backgroundColor: colors.background, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 420, backgroundColor: colors.white, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: colors.text, marginBottom: 12 },
  fieldRow: { marginBottom: 10 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  btnText: { fontWeight: '700' as const },
});
