# Loading & Perceived Performance

Strategies for managing loading states and improving perceived performance.

## Response Time Guidelines

| Duration | Perception | Required Feedback |
|----------|------------|-------------------|
| 0-100ms | Instant | None |
| 100-300ms | Slight pause | Subtle visual change |
| 300-1000ms | Noticeable wait | Loading indicator |
| 1-3s | Slow | Progress bar / Skeleton |
| 3-10s | Very slow | Progress + explanation |
| 10s+ | Broken | Progress + cancel option |

---

## Loading Indicator Types

### Spinner

**When to use:** Unknown duration, quick operations (< 3 seconds)

```typescript
import { ActivityIndicator } from 'react-native';

function LoadingSpinner({ size = 'small', color }) {
  const { colors } = useThemedColors();

  return (
    <View style={styles.centered}>
      <ActivityIndicator
        size={size}
        color={color ?? colors.primary}
      />
    </View>
  );
}
```

### Progress Bar

**When to use:** Known duration, file uploads, multi-step processes

```typescript
function ProgressBar({ progress }) {
  const { colors } = useThemedColors();

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    padding: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
```

### Skeleton Screen

**When to use:** Content structure known, lists and cards

```typescript
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

function CardSkeleton() {
  return (
    <MotiView
      transition={{ type: 'timing' }}
      animate={{ backgroundColor: colors.background.secondary }}
      style={styles.card}
    >
      <Skeleton colorMode="light" width="100%" height={200} />
      <View style={styles.cardContent}>
        <Skeleton colorMode="light" width="70%" height={20} />
        <Skeleton colorMode="light" width="40%" height={16} />
      </View>
    </MotiView>
  );
}

function ListSkeleton({ count = 5 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <Skeleton colorMode="light" width={48} height={48} radius="round" />
          <View style={styles.listItemContent}>
            <Skeleton colorMode="light" width="60%" height={16} />
            <Skeleton colorMode="light" width="40%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}
```

### Shimmer Effect

**When to use:** Premium feel, content placeholders

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

function ShimmerPlaceholder({ width, height }) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.shimmerContainer, { width, height }]}>
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width, height }}
        />
      </Animated.View>
    </View>
  );
}
```

---

## Progressive Loading

### Load Critical Content First

```typescript
function ProductPage({ id }) {
  // Parallel queries with different priorities
  const { data: product, isLoading: productLoading } = useProductQuery(id);
  const { data: reviews } = useReviewsQuery(id, { enabled: !!product });
  const { data: related } = useRelatedProductsQuery(id, { enabled: !!product });

  if (productLoading) {
    return <ProductSkeleton />;
  }

  return (
    <ScrollView>
      {/* Critical - show immediately */}
      <ProductHeader product={product} />
      <ProductPrice price={product.price} />
      <AddToCartButton product={product} />

      {/* Secondary - can load later */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsSection reviews={reviews} />
      </Suspense>

      {/* Tertiary - lowest priority */}
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts products={related} />
      </Suspense>
    </ScrollView>
  );
}
```

### Optimistic Updates

```typescript
function LikeButton({ postId, initialLiked, initialCount }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const mutation = useLikeMutation();

  const handlePress = () => {
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(count + (newLiked ? 1 : -1));

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Actual mutation
    mutation.mutate(
      { postId, liked: newLiked },
      {
        onError: () => {
          // Rollback on error
          setLiked(!newLiked);
          setCount(count);
          Toast.show('Failed to update. Please try again.');
        },
      }
    );
  };

  return (
    <Pressable onPress={handlePress} style={styles.likeButton}>
      <IconSymbol
        name={liked ? 'heart.fill' : 'heart'}
        color={liked ? colors.semantic.error : colors.text.tertiary}
      />
      <Text>{count}</Text>
    </Pressable>
  );
}
```

---

## Loading State Patterns

### Button Loading State

```typescript
function SubmitButton({ onPress, isLoading, title }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={[styles.button, isLoading && styles.buttonLoading]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
```

### Pull to Refresh

```typescript
function RefreshableList({ data, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);

    // Success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <FlatList
      data={data}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          progressViewOffset={20}
        />
      }
      renderItem={renderItem}
    />
  );
}
```

### Infinite Scroll

```typescript
function InfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery();

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <FlatList
      data={data?.pages.flatMap((page) => page.items)}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
  );
}
```

---

## Offline & Error States

### Network Status

```typescript
import NetInfo from '@react-native-community/netinfo';

function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return isConnected;
}

function OfflineBanner() {
  const isConnected = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={styles.offlineBanner}>
      <IconSymbol name="wifi.slash" color="white" />
      <Text style={styles.offlineText}>No internet connection</Text>
    </View>
  );
}
```

### Retry Logic

```typescript
function RetryableContent({ query }) {
  const { data, isLoading, isError, refetch } = query;

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          We couldn't load this content. Please check your connection.
        </Text>
        <Button
          title="Try Again"
          onPress={() => refetch()}
          variant="secondary"
        />
      </View>
    );
  }

  return <Content data={data} />;
}
```

---

## Performance Optimization

### Image Loading

```typescript
import { Image } from 'expo-image';

function OptimizedImage({ source, style }) {
  return (
    <Image
      source={source}
      style={style}
      placeholder={blurhash}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}
```

### List Optimization

```typescript
function OptimizedList({ data }) {
  const renderItem = useCallback(
    ({ item }) => <ListItem item={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item) => item.id,
    []
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      initialNumToRender={10}
    />
  );
}
```

### Preloading

```typescript
// Preload next screen data
function ListItem({ item, onPress }) {
  const queryClient = useQueryClient();

  const handlePressIn = () => {
    // Prefetch detail data on press start
    queryClient.prefetchQuery({
      queryKey: ['item', item.id],
      queryFn: () => fetchItemDetail(item.id),
    });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPress={() => onPress(item)}>
      <ItemContent item={item} />
    </Pressable>
  );
}
```

---

## Loading Animations

### Fun Loading Indicators

```typescript
import LottieView from 'lottie-react-native';

function BrandedLoader() {
  return (
    <View style={styles.loaderContainer}>
      <LottieView
        source={require('./assets/loading-animation.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
      <Text style={styles.loaderText}>Loading your content...</Text>
    </View>
  );
}
```

### Progress with Context

```typescript
function UploadProgress({ progress, fileName }) {
  return (
    <View style={styles.uploadContainer}>
      <View style={styles.uploadHeader}>
        <IconSymbol name="doc.fill" />
        <Text style={styles.fileName}>{fileName}</Text>
      </View>
      <ProgressBar progress={progress} />
      <Text style={styles.progressDetail}>
        {progress < 1
          ? `Uploading... ${Math.round(progress * 100)}%`
          : 'Processing...'}
      </Text>
    </View>
  );
}
```

---

## Anti-Patterns

### Avoid

1. **Blank screens** - Always show skeleton or spinner
2. **Blocking spinners** - Let users interact when possible
3. **No progress indication** - Users think app is frozen
4. **Loading without context** - Explain what's happening
5. **Multiple spinners** - Consolidate loading states
6. **Spinner for < 300ms** - Just show content
7. **No cancel option** - Allow escape from long operations
