import { relations, sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

/* ============================================================
   Users
   ============================================================ */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    passwordHash: text("password_hash"),
    tgId: text("tg_id"),
    tgUsername: text("tg_username"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    city: text("city"),
    role: text("role", { enum: ["user", "admin"] })
      .notNull()
      .default("user"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_tg_id_uq").on(t.tgId),
  ],
);

/* ============================================================
   Sessions (Lucia v3)
   ============================================================ */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

/* ============================================================
   Restaurants
   ============================================================ */
export const restaurants = sqliteTable(
  "restaurants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(),
    address: text("address").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    phone: text("phone"),
    website: text("website"),
    description: text("description"),
    hoursJson: text("hours_json"),
    priceAvg: integer("price_avg"),
    rating: real("rating"),
    coverUrl: text("cover_url"),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    tagsJson: text("tags_json"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("restaurants_slug_uq").on(t.slug),
    index("restaurants_status_idx").on(t.status),
    index("restaurants_lat_lng_idx").on(t.lat, t.lng),
  ],
);

/* ============================================================
   Restaurant photos
   ============================================================ */
export const restaurantPhotos = sqliteTable(
  "restaurant_photos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("restaurant_photos_restaurant_idx").on(t.restaurantId)],
);

/* ============================================================
   Menu categories
   ============================================================ */
export const menuCategories = sqliteTable(
  "menu_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("menu_categories_restaurant_idx").on(t.restaurantId)],
);

/* ============================================================
   Menu items
   ============================================================ */
export const menuItems = sqliteTable(
  "menu_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => menuCategories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    photoUrl: text("photo_url"),
    status: text("status", { enum: ["active", "hidden"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("menu_items_restaurant_idx").on(t.restaurantId),
    index("menu_items_category_idx").on(t.categoryId),
  ],
);

/* ============================================================
   Business lunches
   ============================================================ */
export const businessLunches = sqliteTable(
  "business_lunches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    timeFrom: text("time_from").notNull(),
    timeTo: text("time_to").notNull(),
    daysMask: integer("days_mask").notNull().default(0),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("business_lunches_restaurant_idx").on(t.restaurantId)],
);

/* ============================================================
   Business lunch days (per-weekday courses JSON)
   ============================================================ */
export const businessLunchDays = sqliteTable(
  "business_lunch_days",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lunchId: integer("lunch_id")
      .notNull()
      .references(() => businessLunches.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    coursesJson: text("courses_json").notNull(),
  },
  (t) => [
    index("business_lunch_days_lunch_idx").on(t.lunchId),
    uniqueIndex("business_lunch_days_lunch_weekday_uq").on(
      t.lunchId,
      t.weekday,
    ),
  ],
);

/* ============================================================
   Favorites — полиморфные (ресторан, блюдо, бизнес-ланч)
   ============================================================ */
export const FAVORITE_TARGET_TYPES = [
  "restaurant",
  "menu_item",
  "lunch",
] as const;
export type FavoriteTargetType = (typeof FAVORITE_TARGET_TYPES)[number];

export const favorites = sqliteTable(
  "favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: FAVORITE_TARGET_TYPES }).notNull(),
    targetId: integer("target_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("favorites_user_target_uq").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
    index("favorites_user_idx").on(t.userId),
    index("favorites_target_idx").on(t.targetType, t.targetId),
  ],
);

/* ============================================================
   Search history
   ============================================================ */
export const searchHistory = sqliteTable(
  "search_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    query: text("query").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("search_history_user_idx").on(t.userId)],
);

/* ============================================================
   Push subscriptions (Web Push / VAPID)
   ============================================================ */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    keysJson: text("keys_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("push_subscriptions_endpoint_uq").on(t.endpoint),
    index("push_subscriptions_user_idx").on(t.userId),
  ],
);

/* ============================================================
   Reviews
   ============================================================ */
export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    rating: integer("rating").notNull(),
    receiptImageUrl: text("receipt_image_url").notNull(),
    receiptTotal: integer("receipt_total"),
    receiptDate: text("receipt_date"),
    receiptItemsJson: text("receipt_items_json"),
    receiptEstablishmentName: text("receipt_establishment_name"),
    matchConfidence: real("match_confidence"),
    status: text("status", {
      enum: ["pending", "approved", "rejected"],
    })
      .notNull()
      .default("approved"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("reviews_restaurant_idx").on(t.restaurantId),
    index("reviews_user_idx").on(t.userId),
    index("reviews_status_idx").on(t.status),
  ],
);

/* ============================================================
   Receipts (standalone uploads for statistics)
   ============================================================ */
export const receipts = sqliteTable(
  "receipts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: integer("restaurant_id").references(() => restaurants.id, {
      onDelete: "set null",
    }),
    imageUrl: text("image_url").notNull(),
    total: integer("total"),
    date: text("date"),
    itemsJson: text("items_json"),
    establishmentName: text("establishment_name"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("receipts_user_idx").on(t.userId)],
);

/* ============================================================
   Relations
   ============================================================ */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  favorites: many(favorites),
  searchHistory: many(searchHistory),
  pushSubscriptions: many(pushSubscriptions),
  reviews: many(reviews),
  receipts: many(receipts),
}));



export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  photos: many(restaurantPhotos),
  menuCategories: many(menuCategories),
  menuItems: many(menuItems),
  businessLunches: many(businessLunches),
  reviews: many(reviews),
}));

export const restaurantPhotosRelations = relations(
  restaurantPhotos,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [restaurantPhotos.restaurantId],
      references: [restaurants.id],
    }),
  }),
);

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ one, many }) => ({
    restaurant: one(restaurants, {
      fields: [menuCategories.restaurantId],
      references: [restaurants.id],
    }),
    items: many(menuItems),
  }),
);

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const businessLunchesRelations = relations(
  businessLunches,
  ({ one, many }) => ({
    restaurant: one(restaurants, {
      fields: [businessLunches.restaurantId],
      references: [restaurants.id],
    }),
    days: many(businessLunchDays),
  }),
);

export const businessLunchDaysRelations = relations(
  businessLunchDays,
  ({ one }) => ({
    lunch: one(businessLunches, {
      fields: [businessLunchDays.lunchId],
      references: [businessLunches.id],
    }),
  }),
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [receipts.restaurantId],
    references: [restaurants.id],
  }),
}));
