import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ListRenderItem,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { RoomCard } from '../components/RoomCard';
import { FilterBar } from '../components/FilterBar';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CARD_HEIGHT_ESTIMATE = 310; // For getItemLayout optimization

export const RoomDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const rooms = useBookingStore((state) => state.rooms);
  const filters = useBookingStore((state) => state.filters);
  const resetFilters = useBookingStore((state) => state.resetFilters);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Search Query filter (room name, floor, description, lab spec)
      if (filters.searchQuery.trim().length > 0) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = room.name.toLowerCase().includes(query);
        const matchesDesc = room.description.toLowerCase().includes(query);
        const matchesBuilding = room.building.toLowerCase() === query;
        const matchesSpec = room.labSpec ? room.labSpec.toLowerCase().includes(query) : false;

        if (!matchesName && !matchesDesc && !matchesBuilding && !matchesSpec) {
          return false;
        }
      }

      // 2. Building filter (A, B, C, V or ALL)
      if (filters.building !== 'ALL' && room.building !== filters.building) {
        return false;
      }

      // 3. Minimum Capacity filter (2-20)
      if (filters.minCapacity > 0 && room.capacity < filters.minCapacity) {
        return false;
      }

      // 4. Equipment filter (All selected equipment must be present)
      if (filters.equipment.length > 0) {
        const hasAllEquipment = filters.equipment.every((eq) =>
          room.equipment.includes(eq)
        );
        if (!hasAllEquipment) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, filters]);

  const handlePressRoom = useCallback(
    (room: Room) => {
      navigation.navigate('RoomDetail', { roomId: room.id });
    },
    [navigation]
  );

  const renderItem: ListRenderItem<Room> = useCallback(
    ({ item }) => <RoomCard room={item} onPress={handlePressRoom} />,
    [handlePressRoom]
  );

  const keyExtractor = useCallback((item: Room) => item.id, []);

  // FlatList getItemLayout for smooth 60fps scrolling
  const getItemLayout = useCallback(
    (_data: ArrayLike<Room> | null | undefined, index: number) => ({
      length: CARD_HEIGHT_ESTIMATE,
      offset: CARD_HEIGHT_ESTIMATE * index,
      index,
    }),
    []
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top App Bar with VKU branding */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandSubtitle}>VIETNAM - KOREA UNIVERSITY</Text>
          <Text style={styles.brandTitle}>Study Room Booking</Text>
        </View>
        <View style={styles.badgePill}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgePillText}>Real-time</Text>
        </View>
      </View>

      {/* Multi-Parameter Filter Bar */}
      <FilterBar />

      {/* Results Count & Quick Summary */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          <Text style={styles.resultsCountBold}>{filteredRooms.length}</Text> rooms & labs available
        </Text>
        <Text style={styles.resultsHint}>Buildings A, B, C, V</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={48} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No matching study rooms</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your building, equipment, or capacity filters.
      </Text>
      <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
        <Text style={styles.resetButtonText}>Reset All Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.wrapper}>
        <FlatList
          data={filteredRooms}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          getItemLayout={Platform.OS === 'web' ? undefined : getItemLayout}
          // FlatList web/native optimized props
          removeClippedSubviews={Platform.OS !== 'web'}
          initialNumToRender={6}
          maxToRenderPerBatch={Platform.OS === 'web' ? 12 : 6}
          windowSize={Platform.OS === 'web' ? 21 : 7}
          updateCellsBatchingPeriod={50}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#0052CC"
              colors={['#0052CC']}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  wrapper: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  header: {
    marginBottom: 8,
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0052CC',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 13,
    color: '#64748B',
  },
  resultsCountBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resultsHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
