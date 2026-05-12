# Requirements Document: Advanced Cooking Features

## Introduction

This document specifies comprehensive enhancements for the Smart Cooking AI mobile application covering both frontend (React Native) and backend (Flask + Firestore) improvements. The enhancements focus on improving user experience through modern UI patterns, hands-free cooking support, real-time collaboration, intelligent personalization, and robust infrastructure. These features aim to transform the cooking experience from a simple recipe app into a comprehensive, intelligent cooking companion.

## Glossary

- **App**: The Smart Cooking AI mobile application (React Native with Expo)
- **User**: A person using the Smart Cooking AI mobile application
- **Backend**: The Python Flask API server that processes requests
- **Firestore**: Firebase Firestore database storing user and application data
- **AI_Service**: Google Gemini AI service for recipe generation and recommendations
- **Skeleton_Loader**: A shimmer placeholder component displayed during content loading
- **Gesture_Handler**: The component managing swipe, pinch, and gesture interactions
- **Video_Player**: The component playing short video clips for recipe steps
- **Voice_Controller**: The component handling voice commands and speech recognition
- **Recipe_Card**: An animated card component displaying recipe information
- **Theme_Manager**: The component managing dark mode and theme settings
- **Timer_Manager**: The component managing multiple simultaneous cooking timers
- **Widget_Manager**: The component managing home screen widgets
- **Barcode_Scanner**: The component scanning product barcodes
- **Session_Manager**: The component managing real-time cooking sessions
- **Ranking_Engine**: The component calculating personalized recipe rankings
- **Rate_Limiter**: The component enforcing API rate limits
- **Price_Tracker**: The component tracking ingredient prices across stores
- **Job_Queue**: The asynchronous job processing system
- **Translation_Service**: The component handling multi-language support
- **Nutrition_DB**: The USDA FoodData nutritional database integration
- **Audit_Logger**: The component logging user actions for compliance
- **AB_Testing_Framework**: The component managing A/B tests for features
- **Cooking_Step**: A single instruction step in a recipe
- **Timer**: A countdown timer for cooking tasks
- **Widget**: A home screen widget displaying app information
- **Cooking_Session**: A real-time collaborative cooking session
- **Ranking_Score**: A personalized relevance score for recipes
- **Rate_Limit**: A restriction on API request frequency
- **Price_Data**: Ingredient pricing information from retail stores
- **Background_Job**: An asynchronous task processed by the job queue
- **Audit_Log**: A record of user actions for compliance tracking
- **AB_Test**: An experiment comparing different feature implementations

## Requirements

### Requirement 1: Skeleton Loading Screen

**User Story:** As a User, I want to see shimmer placeholders while content loads, so that the app feels responsive and I understand that content is being fetched.

#### Acceptance Criteria

1. WHEN the App loads recipe lists, THE Skeleton_Loader SHALL display shimmer placeholders matching the layout of recipe cards
2. WHEN the App loads recipe details, THE Skeleton_Loader SHALL display shimmer placeholders for image, title, ingredients, and instructions sections
3. WHEN the App loads community posts, THE Skeleton_Loader SHALL display shimmer placeholders matching post card layouts
4. THE Skeleton_Loader SHALL use a smooth shimmer animation with 1.5 second cycle duration
5. WHEN content finishes loading, THE Skeleton_Loader SHALL fade out within 200ms and reveal actual content
6. THE Skeleton_Loader SHALL adapt to dark mode with appropriate shimmer colors
7. THE Skeleton_Loader SHALL display for a minimum of 300ms to avoid flashing on fast connections
8. FOR ALL skeleton placeholders, the shimmer animation SHALL move from left to right consistently

### Requirement 2: Gesture Navigation for Cooking Steps

**User Story:** As a User with wet or dirty hands while cooking, I want to navigate between cooking steps using swipe gestures, so that I can follow recipes without touching the screen precisely.

#### Acceptance Criteria

1. WHEN the User is in cooking mode, THE Gesture_Handler SHALL detect horizontal swipe gestures
2. WHEN the User swipes left, THE App SHALL navigate to the next cooking step
3. WHEN the User swipes right, THE App SHALL navigate to the previous cooking step
4. THE Gesture_Handler SHALL require a minimum swipe distance of 50 pixels to trigger navigation
5. THE Gesture_Handler SHALL provide visual feedback during swipe with a sliding animation
6. WHEN the User is on the first step and swipes right, THE App SHALL display a bounce animation indicating no previous step
7. WHEN the User is on the last step and swipes left, THE App SHALL display a bounce animation indicating no next step
8. THE Gesture_Handler SHALL disable swipe navigation when the User is interacting with scrollable content within a step

### Requirement 3: Pinch-to-Zoom for Recipe Images

**User Story:** As a User, I want to pinch-zoom recipe images, so that I can see ingredient details or plating presentation more clearly.

#### Acceptance Criteria

1. WHEN the User performs a pinch gesture on a recipe image, THE Gesture_Handler SHALL scale the image proportionally
2. THE Gesture_Handler SHALL support zoom levels from 1x (original) to 4x (maximum)
3. WHEN the User zooms beyond maximum level, THE Gesture_Handler SHALL apply a rubber-band effect and snap back to 4x
4. WHEN the User zooms below minimum level, THE Gesture_Handler SHALL apply a rubber-band effect and snap back to 1x
5. THE Gesture_Handler SHALL allow panning of zoomed images with single-finger drag
6. WHEN the User double-taps an image, THE Gesture_Handler SHALL toggle between 1x and 2x zoom levels
7. THE Gesture_Handler SHALL animate zoom transitions smoothly over 250ms
8. WHEN the User releases a pinch gesture, THE Gesture_Handler SHALL maintain the current zoom level until reset

### Requirement 4: Video Step Preview

**User Story:** As a User, I want to watch short video clips demonstrating cooking techniques for each step, so that I can learn proper methods and avoid mistakes.

#### Acceptance Criteria

1. WHEN a Cooking_Step includes a video URL, THE Video_Player SHALL display a video thumbnail with a play icon overlay
2. WHEN the User taps the video thumbnail, THE Video_Player SHALL play the video in an inline player
3. THE Video_Player SHALL autoplay videos on muted mode when the step becomes visible
4. THE Video_Player SHALL support videos between 5 and 15 seconds in duration
5. THE Video_Player SHALL loop videos continuously until the User navigates away
6. THE Video_Player SHALL provide play/pause controls overlaid on the video
7. WHEN the User taps the video, THE Video_Player SHALL toggle between play and pause states
8. THE Video_Player SHALL preload the next step's video while the current step is active
9. WHEN network connectivity is poor, THE Video_Player SHALL display a loading indicator and fallback to static images after 5 seconds

### Requirement 5: Voice Commands for Hands-Free Control

**User Story:** As a User with hands occupied while cooking, I want to control the app using voice commands, so that I can navigate steps and control timers without touching the device.

#### Acceptance Criteria

1. WHEN the User enables voice control in cooking mode, THE Voice_Controller SHALL activate speech recognition
2. WHEN the User says "tiếp theo" or "next", THE Voice_Controller SHALL navigate to the next cooking step
3. WHEN the User says "quay lại" or "back", THE Voice_Controller SHALL navigate to the previous cooking step
4. WHEN the User says "dừng timer" or "stop timer", THE Voice_Controller SHALL pause the active timer
5. WHEN the User says "bắt đầu timer" or "start timer", THE Voice_Controller SHALL resume the active timer
6. WHEN the User says "đọc bước này" or "read step", THE Voice_Controller SHALL use text-to-speech to read the current step aloud
7. THE Voice_Controller SHALL display visual feedback (microphone icon pulsing) when listening for commands
8. THE Voice_Controller SHALL support both Vietnamese and English voice commands
9. WHEN the Voice_Controller fails to recognize a command, THE App SHALL display a message showing supported commands
10. THE Voice_Controller SHALL require explicit activation to avoid accidental triggers from cooking conversations

### Requirement 6: Animated Recipe Card with Flip Effect

**User Story:** As a User browsing recipes, I want to see recipe cards that flip to reveal nutritional information, so that I can quickly assess both visual appeal and health benefits.

#### Acceptance Criteria

1. THE Recipe_Card SHALL display recipe image, name, and preparation time on the front face
2. WHEN the User taps a Recipe_Card, THE Recipe_Card SHALL flip with a 3D rotation animation to reveal the back face
3. THE Recipe_Card SHALL display nutritional information (calories, protein, carbs, fat) on the back face
4. THE Recipe_Card SHALL complete the flip animation within 400ms
5. WHEN the User taps the back face, THE Recipe_Card SHALL flip back to the front face
6. THE Recipe_Card SHALL use shared element transitions when navigating to recipe details
7. THE Recipe_Card SHALL maintain flip state when scrolling through recipe lists
8. THE Recipe_Card SHALL support both portrait and landscape orientations with appropriate layout adjustments

### Requirement 7: Comprehensive Dark Mode Support

**User Story:** As a User, I want a fully implemented dark mode, so that I can use the app comfortably in low-light environments and reduce eye strain.

#### Acceptance Criteria

1. THE Theme_Manager SHALL detect the system dark mode setting on app launch
2. THE Theme_Manager SHALL provide a manual toggle in settings to override system preference
3. WHEN dark mode is enabled, THE App SHALL apply dark theme colors to all screens, components, and navigation elements
4. THE Theme_Manager SHALL use appropriate contrast ratios meeting WCAG AA standards for text readability
5. THE Theme_Manager SHALL persist the user's theme preference in local storage
6. WHEN the system theme changes while the app is running, THE Theme_Manager SHALL update the theme if set to follow system
7. THE Theme_Manager SHALL animate theme transitions smoothly over 300ms
8. THE Theme_Manager SHALL provide theme-aware colors for skeleton loaders, cards, buttons, and input fields
9. THE Theme_Manager SHALL adjust recipe images with a subtle overlay in dark mode to reduce brightness

### Requirement 8: Multiple Simultaneous Timers

**User Story:** As a User cooking multiple dishes, I want to run multiple timers simultaneously, so that I can track different cooking tasks like rice cooking and soup simmering at the same time.

#### Acceptance Criteria

1. THE Timer_Manager SHALL support up to 5 simultaneous active timers
2. WHEN the User starts a timer, THE Timer_Manager SHALL assign a unique identifier and label to the timer
3. THE Timer_Manager SHALL display all active timers in a compact list view accessible from cooking mode
4. WHEN a Timer completes, THE Timer_Manager SHALL trigger a notification with sound and vibration
5. THE Timer_Manager SHALL continue running timers in the background when the app is minimized
6. THE Timer_Manager SHALL display remaining time for each timer with minute and second precision
7. THE Timer_Manager SHALL allow the User to pause, resume, or cancel individual timers
8. WHEN the User taps a timer notification, THE App SHALL navigate to the associated cooking step
9. THE Timer_Manager SHALL persist active timers across app restarts
10. THE Timer_Manager SHALL display a visual indicator (progress ring) showing timer completion percentage

### Requirement 9: Home Screen Widget

**User Story:** As a User, I want to see active timers and today's meal plan on my home screen widget, so that I can monitor cooking progress without opening the app.

#### Acceptance Criteria

1. THE Widget_Manager SHALL provide a small widget (2x2) displaying the next meal from today's meal plan
2. THE Widget_Manager SHALL provide a medium widget (4x2) displaying active timers with countdown
3. THE Widget_Manager SHALL provide a large widget (4x4) displaying both meal plan and active timers
4. THE Widget_Manager SHALL update widget content every 30 seconds when timers are active
5. WHEN the User taps a widget, THE App SHALL open to the relevant screen (meal plan or cooking mode)
6. THE Widget_Manager SHALL display "No active timers" message when no timers are running
7. THE Widget_Manager SHALL display "No meals planned" message when meal plan is empty
8. THE Widget_Manager SHALL adapt widget appearance to system light/dark mode
9. THE Widget_Manager SHALL handle widget configuration through the app's widget settings screen

### Requirement 10: Barcode Scanner for Packaged Products

**User Story:** As a User, I want to scan product barcodes to quickly add packaged ingredients to my inventory, so that I can track all ingredients including pre-packaged items.

#### Acceptance Criteria

1. THE Barcode_Scanner SHALL activate the device camera when the User taps "Scan Barcode" in inventory screen
2. WHEN the Barcode_Scanner detects a valid barcode, THE Barcode_Scanner SHALL capture the barcode value
3. THE Barcode_Scanner SHALL query the Open Food Facts API with the barcode value
4. WHEN product information is found, THE Barcode_Scanner SHALL display product name, brand, and nutritional information
5. WHEN the User confirms, THE App SHALL add the product to the inventory with retrieved information
6. WHEN product information is not found, THE Barcode_Scanner SHALL allow manual entry of product details
7. THE Barcode_Scanner SHALL support EAN-13, UPC-A, and QR code formats
8. THE Barcode_Scanner SHALL display a scanning frame overlay to guide barcode positioning
9. THE Barcode_Scanner SHALL provide haptic feedback when a barcode is successfully scanned
10. THE Barcode_Scanner SHALL cache product information locally to support offline scanning of previously scanned items

### Requirement 11: Real-Time Collaborative Cooking Sessions

**User Story:** As a User cooking with family or friends, I want to share a cooking session in real-time, so that everyone can see the current step and progress together.

#### Acceptance Criteria

1. THE Session_Manager SHALL allow the User to create a new cooking session with a unique session code
2. THE Session_Manager SHALL allow other users to join a session by entering the session code
3. WHEN the session host navigates to a different step, THE Session_Manager SHALL synchronize the step change to all participants within 500ms
4. WHEN the session host starts or stops a timer, THE Session_Manager SHALL synchronize the timer state to all participants
5. THE Session_Manager SHALL display participant avatars and names in the cooking mode header
6. THE Session_Manager SHALL allow any participant to mark ingredients as completed, visible to all participants
7. THE Session_Manager SHALL use Firestore real-time listeners for synchronization
8. WHEN a participant loses connection, THE Session_Manager SHALL display an offline indicator for that participant
9. WHEN the session host ends the session, THE Session_Manager SHALL notify all participants and close the session
10. THE Session_Manager SHALL limit sessions to 10 participants maximum

### Requirement 12: Personalized Recipe Ranking

**User Story:** As a User, I want recipe suggestions ranked based on my cooking history and health preferences, so that I see the most relevant recipes first.

#### Acceptance Criteria

1. THE Ranking_Engine SHALL calculate a Ranking_Score for each recipe based on multiple factors
2. THE Ranking_Engine SHALL increase Ranking_Score for recipes using ingredients the User frequently cooks with
3. THE Ranking_Engine SHALL increase Ranking_Score for recipes matching the User's dietary preferences
4. THE Ranking_Engine SHALL increase Ranking_Score for recipes with similar nutritional profiles to User's health goals
5. THE Ranking_Engine SHALL decrease Ranking_Score for recipes the User has cooked recently (within 7 days)
6. THE Ranking_Engine SHALL use collaborative filtering to boost recipes popular among users with similar preferences
7. THE Ranking_Engine SHALL integrate Gemini AI for semantic similarity between User preferences and recipe descriptions
8. THE Ranking_Engine SHALL recalculate rankings when User's health profile or cooking history changes
9. THE Ranking_Engine SHALL cache ranking results for 1 hour to improve performance
10. THE Ranking_Engine SHALL provide an explanation for top-ranked recipes (e.g., "Matches your low-carb goal")

### Requirement 13: Intelligent Rate Limiting

**User Story:** As a system administrator, I want intelligent rate limiting with burst allowance, so that the API remains available during traffic spikes while preventing abuse.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL implement a sliding window algorithm for rate limit tracking
2. THE Rate_Limiter SHALL allow 100 requests per hour per user for standard endpoints
3. THE Rate_Limiter SHALL allow 10 requests per hour per user for AI-intensive endpoints
4. THE Rate_Limiter SHALL provide a burst allowance of 20 requests within 1 minute
5. WHEN a user exceeds the rate limit, THE Rate_Limiter SHALL return HTTP 429 with retry-after header
6. THE Rate_Limiter SHALL use Redis (Upstash free tier) for distributed rate limit tracking
7. THE Rate_Limiter SHALL exempt authenticated Pro users from standard rate limits
8. THE Rate_Limiter SHALL apply stricter limits (50% of standard) for unauthenticated requests
9. THE Rate_Limiter SHALL log rate limit violations for abuse detection
10. THE Rate_Limiter SHALL provide rate limit status in response headers (X-RateLimit-Remaining, X-RateLimit-Reset)

### Requirement 14: Ingredient Price Tracking

**User Story:** As a User, I want to see where to buy ingredients at the best prices, so that I can save money on grocery shopping.

#### Acceptance Criteria

1. THE Price_Tracker SHALL scrape ingredient prices from major Vietnamese retailers (BigC, WinMart, Co.opMart)
2. THE Price_Tracker SHALL update price data daily via scheduled background jobs
3. WHEN the User views a recipe, THE Price_Tracker SHALL display estimated total cost based on current prices
4. THE Price_Tracker SHALL show price comparison across retailers for each ingredient
5. THE Price_Tracker SHALL highlight the cheapest retailer for each ingredient with a badge
6. THE Price_Tracker SHALL cache price data in Firestore for 24 hours
7. WHEN price data is unavailable, THE Price_Tracker SHALL display "Price unavailable" instead of showing stale data
8. THE Price_Tracker SHALL allow the User to select preferred retailers to filter price comparisons
9. THE Price_Tracker SHALL track price history and display price trends (up/down/stable) over the past 30 days
10. THE Price_Tracker SHALL provide a "Create Shopping List" button that groups ingredients by cheapest retailer

### Requirement 15: Asynchronous Job Queue

**User Story:** As a system administrator, I want heavy AI processing to run in the background, so that API responses remain fast and users receive results via push notifications.

#### Acceptance Criteria

1. THE Job_Queue SHALL use Celery with Redis as the message broker for task distribution
2. WHEN the User requests AI recipe generation, THE Backend SHALL queue the job and return a job ID immediately
3. THE Job_Queue SHALL process AI generation jobs asynchronously in background workers
4. WHEN a job completes, THE Job_Queue SHALL store results in Firestore with the job ID as key
5. THE Job_Queue SHALL send a push notification to the User when their job completes
6. THE Job_Queue SHALL implement job retry logic with exponential backoff (3 retries max)
7. THE Job_Queue SHALL set job timeout to 60 seconds for AI generation tasks
8. WHEN a job fails after all retries, THE Job_Queue SHALL log the error and notify the User of failure
9. THE Job_Queue SHALL provide a status endpoint for polling job progress (pending/processing/completed/failed)
10. THE Job_Queue SHALL clean up completed job results after 24 hours

### Requirement 16: Multi-Language Support

**User Story:** As a User, I want the app to support multiple languages, so that I can use the app in my preferred language.

#### Acceptance Criteria

1. THE Translation_Service SHALL support Vietnamese, English, and Thai languages
2. THE Translation_Service SHALL detect the User's device language on first launch
3. THE Translation_Service SHALL allow the User to manually select language in settings
4. WHEN the User changes language, THE App SHALL update all UI text within 500ms without requiring restart
5. THE Backend SHALL accept an Accept-Language header to determine response language
6. THE AI_Service SHALL generate recipes in the requested language based on Accept-Language header
7. THE Translation_Service SHALL store translations in JSON files organized by language code (vi.json, en.json, th.json)
8. THE Translation_Service SHALL fall back to English for missing translations
9. THE Translation_Service SHALL support pluralization rules for each language
10. THE Translation_Service SHALL format dates, times, and numbers according to locale conventions

### Requirement 17: USDA Nutritional Database Integration

**User Story:** As a User, I want accurate nutritional information from a trusted database, so that I can make informed dietary decisions.

#### Acceptance Criteria

1. THE Nutrition_DB SHALL integrate with the USDA FoodData Central API for nutritional data
2. WHEN the User views a recipe, THE Nutrition_DB SHALL query USDA API for each ingredient's nutritional values
3. THE Nutrition_DB SHALL calculate total nutritional values by summing ingredient contributions
4. THE Nutrition_DB SHALL cache USDA nutritional data in Firestore for 30 days
5. WHEN USDA data is unavailable for an ingredient, THE Nutrition_DB SHALL fall back to AI estimation
6. THE Nutrition_DB SHALL display nutritional information per serving with adjustable serving sizes
7. THE Nutrition_DB SHALL provide detailed micronutrient information (vitamins, minerals) in addition to macronutrients
8. THE Nutrition_DB SHALL support unit conversions (grams to ounces, ml to cups) based on user preference
9. THE Nutrition_DB SHALL display a "Data Source" indicator showing whether data is from USDA or AI estimation
10. THE Nutrition_DB SHALL update cached data when USDA releases database updates

### Requirement 18: Audit Logging and GDPR Compliance

**User Story:** As a system administrator, I want comprehensive audit logs with automatic data retention policies, so that the system complies with GDPR requirements.

#### Acceptance Criteria

1. THE Audit_Logger SHALL log all user actions including login, recipe views, favorites, and data modifications
2. THE Audit_Logger SHALL store logs in Firestore with automatic TTL (Time-To-Live) of 90 days
3. THE Audit_Logger SHALL include timestamp, user ID, action type, IP address, and affected resources in each log entry
4. THE Audit_Logger SHALL anonymize IP addresses by removing the last octet before storage
5. WHEN a user requests data export, THE Backend SHALL include audit logs in the export package
6. WHEN a user deletes their account, THE Audit_Logger SHALL anonymize all associated logs instead of deleting them
7. THE Audit_Logger SHALL provide an admin endpoint for querying logs by user ID, date range, or action type
8. THE Audit_Logger SHALL implement log sampling (10% of read operations) to reduce storage costs
9. THE Audit_Logger SHALL log all data access requests for GDPR compliance reporting
10. THE Audit_Logger SHALL encrypt sensitive log data at rest using Firestore encryption

### Requirement 19: A/B Testing Framework

**User Story:** As a product manager, I want to run A/B tests on recommendation algorithms, so that I can optimize user engagement based on data.

#### Acceptance Criteria

1. THE AB_Testing_Framework SHALL use Firebase Remote Config for feature flag management
2. THE AB_Testing_Framework SHALL assign users to test variants (A/B) based on user ID hashing for consistency
3. THE AB_Testing_Framework SHALL support multiple concurrent A/B tests without interference
4. WHEN a user is assigned to variant B, THE Ranking_Engine SHALL use the experimental algorithm
5. THE AB_Testing_Framework SHALL log variant assignments and user interactions to Firebase Analytics
6. THE AB_Testing_Framework SHALL provide a configuration interface for defining test parameters (traffic split, duration)
7. THE AB_Testing_Framework SHALL support gradual rollout (5% → 25% → 50% → 100%)
8. WHEN a test concludes, THE AB_Testing_Framework SHALL allow promoting the winning variant to 100% of users
9. THE AB_Testing_Framework SHALL cache Remote Config values for 1 hour to reduce API calls
10. THE AB_Testing_Framework SHALL provide statistical significance calculations for test results

### Requirement 20: Skeleton Loader Performance Optimization

**User Story:** As a User on a slow device, I want skeleton loaders to render smoothly without lag, so that the loading experience feels polished.

#### Acceptance Criteria

1. THE Skeleton_Loader SHALL use native animations (Reanimated) instead of JavaScript-based animations
2. THE Skeleton_Loader SHALL render at 60 FPS on devices with 2GB RAM or more
3. THE Skeleton_Loader SHALL limit the number of simultaneous shimmer animations to 10 to prevent performance degradation
4. THE Skeleton_Loader SHALL use memoization to prevent unnecessary re-renders
5. THE Skeleton_Loader SHALL lazy-load skeleton components outside the viewport
6. FOR ALL skeleton animations, the frame rate SHALL remain above 30 FPS on low-end devices

### Requirement 21: Voice Command Accuracy Improvement

**User Story:** As a User, I want voice commands to be recognized accurately even in noisy kitchen environments, so that hands-free control is reliable.

#### Acceptance Criteria

1. THE Voice_Controller SHALL use noise cancellation preprocessing before speech recognition
2. THE Voice_Controller SHALL support wake word detection ("Hey Chef") to activate listening mode
3. THE Voice_Controller SHALL provide visual confirmation of recognized commands before execution
4. THE Voice_Controller SHALL allow the User to undo the last voice command within 3 seconds
5. THE Voice_Controller SHALL adapt recognition sensitivity based on ambient noise levels
6. THE Voice_Controller SHALL maintain a command history for debugging and improvement

### Requirement 22: Widget Update Efficiency

**User Story:** As a User, I want home screen widgets to update without draining battery, so that I can keep widgets enabled all day.

#### Acceptance Criteria

1. THE Widget_Manager SHALL update widgets only when timer values change by at least 1 second
2. THE Widget_Manager SHALL use background fetch with 15-minute minimum intervals when no timers are active
3. THE Widget_Manager SHALL batch widget updates to minimize wake-ups
4. THE Widget_Manager SHALL disable updates when battery level is below 20% and battery saver is enabled

### Requirement 23: Barcode Scanner Performance

**User Story:** As a User, I want barcode scanning to be fast and accurate, so that I can quickly add multiple products to my inventory.

#### Acceptance Criteria

1. THE Barcode_Scanner SHALL detect and decode barcodes within 1 second of appearing in camera view
2. THE Barcode_Scanner SHALL use device hardware acceleration for barcode detection when available
3. THE Barcode_Scanner SHALL provide visual feedback (green highlight) when a barcode is successfully detected
4. THE Barcode_Scanner SHALL automatically advance to product confirmation screen after successful scan

### Requirement 24: Real-Time Session Scalability

**User Story:** As a system administrator, I want cooking sessions to scale efficiently, so that multiple concurrent sessions don't overload Firestore.

#### Acceptance Criteria

1. THE Session_Manager SHALL use Firestore subcollections for session data to optimize query performance
2. THE Session_Manager SHALL implement connection pooling to limit concurrent Firestore listeners
3. THE Session_Manager SHALL throttle synchronization updates to maximum 2 updates per second per session
4. THE Session_Manager SHALL automatically close inactive sessions after 2 hours

### Requirement 25: Price Tracker Data Freshness

**User Story:** As a User, I want to see when price data was last updated, so that I can trust the accuracy of price comparisons.

#### Acceptance Criteria

1. THE Price_Tracker SHALL display the last update timestamp for each price
2. THE Price_Tracker SHALL highlight prices older than 48 hours with a warning indicator
3. THE Price_Tracker SHALL provide a manual refresh button to trigger immediate price updates
4. WHEN the User refreshes prices, THE Price_Tracker SHALL queue a priority scraping job

