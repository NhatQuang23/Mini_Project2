import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildingCode, EquipmentType } from '../types';
import { useBookingStore } from '../store/useBookingStore';

const BUILDINGS: Array<{ label: string; value: BuildingCode | 'ALL' }> = [
  { label: 'All Buildings', value: 'ALL' },
  { label: 'Building A', value: 'A' },
  { label: 'Building B', value: 'B' },
  { label: 'Building C', value: 'C' },
  { label: 'Building V', value: 'V' },
];

const CAPACITIES = [
  { label: 'Any Size', value: 0 },
  { label: '4+ People', value: 4 },
  { label: '8+ People', value: 8 },
  { label: '12+ People', value: 12 },
  { label: '16+ People', value: 16 },
];

const EQUIPMENT_LIST: EquipmentType[] = [
  'Projector',
  'Whiteboard',
  'High-spec PC',
  'AC',
  'Sound System',
  'Video Conference',
];

export const FilterBar: React.FC = () => {
  const {
    filters,
    setSearchQuery,
    setBuildingFilter,
    setMinCapacityFilter,
    toggleEquipmentFilter,
    resetFilters,
  } = useBookingStore();

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.building !== 'ALL' ||
    filters.minCapacity > 0 ||
    filters.equipment.length > 0;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search room, lab spec, floor, building..."
            placeholderTextColor="#94A3B8"
            value={filters.searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {isFiltered && (
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Ionicons name="refresh" size={14} color="#EF4444" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buildings Horizontal Chip Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {BUILDINGS.map((item) => {
          const isSelected = filters.building === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setBuildingFilter(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Capacity & Equipment Quick Filter Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.secondaryRow}
      >
        {/* Capacity Quick Selectors */}
        {CAPACITIES.map((cap) => {
          const isSelected = filters.minCapacity === cap.value;
          return (
            <TouchableOpacity
              key={`cap-${cap.value}`}
              style={[styles.smallChip, isSelected && styles.smallChipActive]}
              onPress={() => setMinCapacityFilter(cap.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="people-outline"
                size={12}
                color={isSelected ? '#0052CC' : '#64748B'}
              />
              <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                {cap.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Equipment Selector Chips */}
        {EQUIPMENT_LIST.map((item) => {
          const isSelected = filters.equipment.includes(item);
          return (
            <TouchableOpacity
              key={`eq-${item}`}
              style={[styles.smallChip, isSelected && styles.eqChipActive]}
              onPress={() => toggleEquipmentFilter(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                size={13}
                color={isSelected ? '#065F46' : '#64748B'}
              />
              <Text style={[styles.smallChipText, isSelected && styles.eqChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  secondaryRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  smallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  smallChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0052CC',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  smallChipTextActive: {
    color: '#0052CC',
  },
  eqChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  eqChipTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
});
