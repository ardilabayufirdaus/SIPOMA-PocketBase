export const translations = {
  en: {
    // Header & Navigation
    appTitle: 'SIPOMA',

    // Error messages and connection handling
    errors: {
      connectionError: 'Connection Error',
      serverUnavailable: 'Server is currently unavailable',
      multipleErrors: '{count} connection errors have occurred',
      retryingConnection: 'Retrying connection...',

      // Mixed content errors
      mixedContentTitle: 'Mixed Content Issues Detected',
      mixedContentDescription:
        'Your browser is blocking connections to the SIPOMA backend server because it uses HTTP (insecure) while the website is loaded over HTTPS (secure).',
      whyThisHappens: 'Why is this happening?',
      mixedContentExplanation:
        'Modern browsers block "mixed content" (HTTP resources on HTTPS pages) by default for security. The SIPOMA backend server uses HTTP, but your browser is accessing this site through HTTPS.',
      howToFix: 'How to fix this:',
      option1: 'Option 1: Allow insecure content for this site',
      option2: 'Option 2: Access the site directly via HTTP',
      useHttpInstead: 'Try accessing the application using HTTP directly:',
      openWithHttp: 'Open with HTTP',
      learnMoreButton: 'Learn how to allow mixed content',
      noteForAdmins: 'Note for Administrators',
      adminSolution:
        'To permanently fix this issue, consider configuring SSL/TLS on your PocketBase server or setting up a reverse proxy with SSL termination.',
    },

    common: {
      reload: 'Reload',
      retry: 'Retry',
      switchToHttp: 'Switch Protocol',
      cancel: 'Cancel',
      close: 'Close',
    },
    appSubtitle: 'Production Management Information System',
    header_welcome: 'Welcome',
    mainDashboard: 'Main Dashboard',
    plantOperations: 'Plant Operations',
    inspection: 'Inspection',
    projectManagement: 'Project Management',
    userManagement: 'User Management',
    permissions: 'Permissions',
    close: 'Close',
    full_name_label: 'Full Name',
    user_is_active_label: 'User is Active',
    add_user_button: 'Add User',
    header_settings: 'Settings',
    header_audit_trail: 'Audit Trail',
    login_title: 'Sign in to your account',
    username: 'Username',
    password: 'Password',
    sign_in: 'Sign in',
    loading: 'Signing in...',
    login_error: 'Invalid username or password',
    header_help_support: 'Help & Support',
    theme_toggle: 'Theme',
    theme_light: 'Light',
    header_sign_out: 'Sign Out',

    // Tooltips
    tooltip_toggle_menu: 'Toggle navigation menu',
    tooltip_add_user: 'Create a new user account',
    tooltip_switch_light: 'Switch to light mode',
    tooltip_notifications: 'View notifications',
    tooltip_notifications_unread: '{count} unread notifications',
    tooltip_sign_out: 'Sign out from application',
    tooltip_open_user_menu: '{name} profile & settings',
    tooltip_close_user_menu: 'Close user menu',

    // Inspection Module
    insp_dashboard: 'Dashboard',
    insp_form: 'New Inspection',
    insp_details: 'Inspection Details',
    insp_reports: 'Reports',

    // Inspection Tabs
    insp_tab_general: 'General Inspection',
    insp_tab_hose_valve_blasting: 'Hose & Valve Blasting MBF',
    insp_tab_safety: 'Safety Checklist',
    insp_tab_documentation: 'Documentation',

    // Hose & Valve Blasting MBF Form
    hose_valve_blasting_title: 'Hose & Valve Blasting MBF Inspection',
    hose_valve_blasting_description:
      'Complete inspection form for hose and valve blasting equipment',
    equipment_information: 'Equipment Information',
    test_parameters: 'Test Parameters',
    additional_notes: 'Additional Notes',
    equipment_id: 'Equipment ID',
    pressure_rating: 'Pressure Rating (PSI)',
    hose_condition: 'Hose Condition',
    valve_condition: 'Valve Condition',
    blast_pressure: 'Blast Pressure (PSI)',
    temperature: 'Temperature (°C)',
    inspection_date: 'Inspection Date',
    inspector_name: 'Inspector Name',
    certification_number: 'Certification Number',
    remarks: 'Remarks',
    select_condition: 'Select condition',
    condition_excellent: 'Excellent',
    condition_good: 'Good',
    condition_fair: 'Fair',
    condition_poor: 'Poor',
    save_inspection: 'Save Inspection',
    reset_form: 'Reset Form',
    inspection_saved: 'Inspection data saved!',

    // Notifications
    notifications_title: 'Notifications',
    mark_all_as_read: 'Mark all as read',
    view_all_notifications: 'View all notifications',
    no_new_notifications: 'No new notifications',
    notification_settings: 'Notification Settings',
    browser_notifications: 'Browser Notifications',
    sound_alerts: 'Sound Alerts',
    critical_only: 'Critical Only',
    snooze_notification: 'Snooze',
    dismiss_notification: 'Dismiss',
    mark_as_read: 'Mark as read',

    // Main Dashboard
    dashboard_welcome_title: 'Welcome to SIPOMA',
    dashboard_welcome_subtitle:
      "Your control center for cement manufacturing management. Here's a quick overview of the system.",
    quote_of_the_day: 'Quote of the Day',
    // Daily Quotes
    daily_quotes: [
      { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
      {
        content: 'Innovation distinguishes between a leader and a follower.',
        author: 'Steve Jobs',
      },
      { content: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
      { content: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
      {
        content: 'The only limit to our realization of tomorrow will be our doubts of today.',
        author: 'Franklin D. Roosevelt',
      },
      { content: 'Excellence is not a skill. It is an attitude.', author: 'Ralph Marston' },
      {
        content:
          'Success is not final, failure is not fatal: It is the courage to continue that counts.',
        author: 'Winston Churchill',
      },
      {
        content: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      { content: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
      {
        content: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
      },
      {
        content: "Your time is limited, so don't waste it living someone else's life.",
        author: 'Steve Jobs',
      },
      { content: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
      { content: "You miss 100% of the shots you don't take.", author: 'Wayne Gretzky' },
      { content: 'The best revenge is massive success.', author: 'Frank Sinatra' },
      {
        content: 'The only impossible journey is the one you never begin.',
        author: 'Tony Robbins',
      },
      { content: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
      { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
      {
        content: 'Keep your face always toward the sunshine—and shadows will fall behind you.',
        author: 'Walt Whitman',
      },
      {
        content: "The harder you work for something, the greater you'll feel when you achieve it.",
        author: 'Anonymous',
      },
      { content: 'Dream bigger. Do bigger.', author: 'Anonymous' },
      { content: "Don't stop when you're tired. Stop when you're done.", author: 'Anonymous' },
      { content: 'Wake up with determination. Go to bed with satisfaction.', author: 'Anonymous' },
      {
        content: 'Do something today that your future self will thank you for.',
        author: 'Anonymous',
      },
      { content: 'Little things make big days.', author: 'Anonymous' },
      { content: "It's going to be hard, but hard does not mean impossible.", author: 'Anonymous' },
      { content: "Don't wait for opportunity. Create it.", author: 'Anonymous' },
      {
        content:
          "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
        author: 'Anonymous',
      },
      {
        content:
          'The key to success is to focus our conscious mind on things we desire, not things we fear.',
        author: 'Brian Tracy',
      },
      {
        content: 'Success is not the key to happiness. Happiness is the key to success.',
        author: 'Albert Schweitzer',
      },
      {
        content: 'The only place where success comes before work is in the dictionary.',
        author: 'Vidal Sassoon',
      },
      {
        content: 'Your most unhappy customers are your greatest source of learning.',
        author: 'Bill Gates',
      },
      {
        content: 'The best way to predict your future is to create it.',
        author: 'Abraham Lincoln',
      },
      {
        content: 'The difference between ordinary and extraordinary is that little extra.',
        author: 'Jimmy Johnson',
      },
      {
        content: 'The way to develop self-confidence is to do the thing you fear.',
        author: 'William Jennings Bryan',
      },
      {
        content: 'The successful warrior is the average man, with laser-like focus.',
        author: 'Bruce Lee',
      },
      { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
      {
        content: 'Innovation distinguishes between a leader and a follower.',
        author: 'Steve Jobs',
      },
      { content: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
      {
        content:
          'Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.',
        author: 'Steve Jobs',
      },
      {
        content:
          'The people who are crazy enough to think they can change the world are the ones who do.',
        author: 'Steve Jobs',
      },
      {
        content: 'Design is not just what it looks like and feels like. Design is how it works.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Quality is more important than quantity. One home run is much better than two doubles.',
        author: 'Steve Jobs',
      },
      {
        content:
          "I'm convinced that about half of what separates successful entrepreneurs from the non-successful ones is pure perseverance.",
        author: 'Steve Jobs',
      },
      { content: 'Have the courage to follow your heart and intuition.', author: 'Steve Jobs' },
      {
        content: "Sometimes life hits you in the head with a brick. Don't lose faith.",
        author: 'Steve Jobs',
      },
      {
        content:
          "You can't connect the dots looking forward; you can only connect them looking backwards.",
        author: 'Steve Jobs',
      },
      { content: 'Creativity is just connecting things.', author: 'Steve Jobs' },
      { content: 'Simple can be harder than complex.', author: 'Steve Jobs' },
      { content: "Things don't have to change the world to be important.", author: 'Steve Jobs' },
      { content: 'I want to put a ding in the universe.', author: 'Steve Jobs' },
      {
        content: 'The most powerful person in the world is the storyteller.',
        author: 'Steve Jobs',
      },
      { content: 'Technology alone is not enough.', author: 'Steve Jobs' },
      { content: 'The journey is the reward.', author: 'Chinese Proverb' },
      { content: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
      {
        content: 'The best time to plant a tree was 20 years ago. The second best time is now.',
        author: 'Chinese Proverb',
      },
      {
        content:
          'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.',
        author: 'Buddha',
      },
      { content: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
      { content: 'All that we are is the result of what we have thought.', author: 'Buddha' },
      { content: 'The mind is everything. What you think you become.', author: 'Buddha' },
      {
        content:
          'Happiness will never come to those who fail to appreciate what they already have.',
        author: 'Anonymous',
      },
      {
        content:
          'The greatest glory in living lies not in never falling, but in rising every time we fall.',
        author: 'Nelson Mandela',
      },
      {
        content: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
      },
      {
        content: "Your time is limited, so don't waste it living someone else's life.",
        author: 'Steve Jobs',
      },
      {
        content: 'If life were predictable it would cease to be life, and be without flavor.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: "If you look at what you have in life, you'll always have more.",
        author: 'Oprah Winfrey',
      },
      {
        content:
          "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
        author: 'James Cameron',
      },
      {
        content: "Life is what happens to you while you're busy making other plans.",
        author: 'John Lennon',
      },
      {
        content:
          'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
        author: 'Mother Teresa',
      },
      {
        content: 'When you reach the end of your rope, tie a knot in it and hang on.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Always remember that you are absolutely unique. Just like everyone else.',
        author: 'Margaret Mead',
      },
      {
        content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.',
        author: 'Helen Keller',
      },
      {
        content: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
      },
      { content: 'Whoever is happy will make others happy too.', author: 'Anne Frank' },
      {
        content:
          'Do not go where the path may lead, go instead where there is no path and leave a trail.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content: 'You will face many defeats in life, but never let yourself be defeated.',
        author: 'Maya Angelou',
      },
      {
        content:
          'The greatest glory in living lies not in never falling, but in rising every time we fall.',
        author: 'Nelson Mandela',
      },
      {
        content:
          "In the end, it's not the years in your life that count. It's the life in your years.",
        author: 'Abraham Lincoln',
      },
      {
        content: 'Never let the fear of striking out keep you from playing the game.',
        author: 'Babe Ruth',
      },
      { content: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
      {
        content:
          "Many of life's failures are people who did not realize how close they were to success when they gave up.",
        author: 'Thomas A. Edison',
      },
      {
        content: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
      },
      {
        content: "Your time is limited, so don't waste it living someone else's life.",
        author: 'Steve Jobs',
      },
      {
        content: 'If life were predictable it would cease to be life, and be without flavor.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: "If you look at what you have in life, you'll always have more.",
        author: 'Oprah Winfrey',
      },
      {
        content:
          "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
        author: 'James Cameron',
      },
      {
        content: "Life is what happens to you while you're busy making other plans.",
        author: 'John Lennon',
      },
      {
        content:
          'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
        author: 'Mother Teresa',
      },
      {
        content: 'When you reach the end of your rope, tie a knot in it and hang on.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Always remember that you are absolutely unique. Just like everyone else.',
        author: 'Margaret Mead',
      },
      {
        content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.',
        author: 'Helen Keller',
      },
      {
        content: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
      },
      { content: 'Whoever is happy will make others happy too.', author: 'Anne Frank' },
      {
        content:
          'Do not go where the path may lead, go instead where there is no path and leave a trail.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content: 'You will face many defeats in life, but never let yourself be defeated.',
        author: 'Maya Angelou',
      },
      {
        content:
          'The greatest glory in living lies not in never falling, but in rising every time we fall.',
        author: 'Nelson Mandela',
      },
      {
        content:
          "In the end, it's not the years in your life that count. It's the life in your years.",
        author: 'Abraham Lincoln',
      },
      {
        content: 'Never let the fear of striking out keep you from playing the game.',
        author: 'Babe Ruth',
      },
      { content: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
      {
        content:
          "Many of life's failures are people who did not realize how close they were to success when they gave up.",
        author: 'Thomas A. Edison',
      },
      {
        content: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
      },
      {
        content: "Your time is limited, so don't waste it living someone else's life.",
        author: 'Steve Jobs',
      },
      {
        content: 'If life were predictable it would cease to be life, and be without flavor.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: "If you look at what you have in life, you'll always have more.",
        author: 'Oprah Winfrey',
      },
      {
        content:
          "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
        author: 'James Cameron',
      },
      {
        content: "Life is what happens to you while you're busy making other plans.",
        author: 'John Lennon',
      },
      {
        content:
          'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
        author: 'Mother Teresa',
      },
      {
        content: 'When you reach the end of your rope, tie a knot in it and hang on.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Always remember that you are absolutely unique. Just like everyone else.',
        author: 'Margaret Mead',
      },
      {
        content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.',
        author: 'Helen Keller',
      },
      {
        content: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
      },
      { content: 'Whoever is happy will make others happy too.', author: 'Anne Frank' },
      {
        content:
          'Do not go where the path may lead, go instead where there is no path and leave a trail.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content: 'You will face many defeats in life, but never let yourself be defeated.',
        author: 'Maya Angelou',
      },
      {
        content:
          'The greatest glory in living lies not in never falling, but in rising every time we fall.',
        author: 'Nelson Mandela',
      },
      {
        content:
          "In the end, it's not the years in your life that count. It's the life in your years.",
        author: 'Abraham Lincoln',
      },
      {
        content: 'Never let the fear of striking out keep you from playing the game.',
        author: 'Babe Ruth',
      },
      { content: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
      {
        content:
          "Many of life's failures are people who did not realize how close they were to success when they gave up.",
        author: 'Thomas A. Edison',
      },
      {
        content: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
      },
      {
        content: "Your time is limited, so don't waste it living someone else's life.",
        author: 'Steve Jobs',
      },
      {
        content: 'If life were predictable it would cease to be life, and be without flavor.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: "If you look at what you have in life, you'll always have more.",
        author: 'Oprah Winfrey',
      },
      {
        content:
          "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
        author: 'James Cameron',
      },
      {
        content: "Life is what happens to you while you're busy making other plans.",
        author: 'John Lennon',
      },
      {
        content:
          'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
        author: 'Mother Teresa',
      },
      {
        content: 'When you reach the end of your rope, tie a knot in it and hang on.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Always remember that you are absolutely unique. Just like everyone else.',
        author: 'Margaret Mead',
      },
      {
        content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.',
        author: 'Helen Keller',
      },
      {
        content: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
      },
      { content: 'Whoever is happy will make others happy too.', author: 'Anne Frank' },
      {
        content:
          'Do not go where the path may lead, go instead where there is no path and leave a trail.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content: 'You will face many defeats in life, but never let yourself be defeated.',
        author: 'Maya Angelou',
      },
      {
        content:
          'The greatest glory in living lies not in never falling, but in rising every time we fall.',
        author: 'Nelson Mandela',
      },
      {
        content:
          "In the end, it's not the years in your life that count. It's the life in your years.",
        author: 'Abraham Lincoln',
      },
      {
        content: 'Never let the fear of striking out keep you from playing the game.',
        author: 'Babe Ruth',
      },
      { content: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
      {
        content:
          "Many of life's failures are people who did not realize how close they were to success when they gave up.",
        author: 'Thomas A. Edison',
      },
    ],
    dashboard_quick_stats_title: 'Quick Stats',
    stat_active_users: 'Active Users',
    stat_online_users: 'Online Users',
    stat_plant_oee: 'Overall Plant OEE',
    stat_active_projects: 'Active Projects',
    dashboard_quick_links_title: 'Quick Links',
    link_plant_dashboard: 'View Plant Dashboard',
    link_project_board: 'Open Project Board',

    // Main Dashboard Charts
    performance_overview_title: 'Performance Overview',
    performance_overview_subtitle: 'Real-time production and efficiency metrics',
    project_status_title: 'Project Status',
    project_status_subtitle: '{count} active projects',
    active_projects_title: 'Active Projects',
    total_production_title: 'Total Production',

    // Settings Page
    settings_page_subtitle: 'Manage your account preferences and profile details here.',
    profile_information: 'Profile Information',
    change_password: 'Change Password',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_password: 'Confirm New Password',
    save_password: 'Save Password',
    password_updated: 'Password updated successfully!',
    password_no_match: 'New passwords do not match.',
    language_settings: 'Language Settings',
    language: 'Language',
    notifications: 'Notifications',
    push_notifications_project: 'Project Deadline Reminders',
    push_notifications_project_desc: 'Get push notifications for upcoming project task deadlines.',
    edit_profile: 'Edit Profile',
    save_changes: 'Save Changes',
    edit_profile_title: 'Edit Profile',
    upload_avatar: 'Upload Avatar',
    avatar_updated: 'Profile updated successfully!',
    upload_avatar_error_size: 'File size must be less than 5MB',
    upload_avatar_error_type: 'File must be an image (JPEG, PNG, GIF, or WebP)',
    upload_avatar_error_upload: 'Failed to upload image',
    uploading: 'Uploading...',

    // Sign Out Modal
    confirm_sign_out_title: 'Confirm Sign Out',
    confirm_sign_out_message: 'Are you sure you want to sign out?',

    // User Management Page
    name: 'Name',
    role: 'Role',
    role_label: 'Role',
    status: 'Status',
    last_active: 'Last Active',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    edit_user_title: 'Edit User',
    add_user_title: 'Add New User',

    // User Management Statistics
    total_users_title: 'Total Users',
    active_users_title: 'Active Users',
    inactive_users_title: 'Inactive Users',
    administrators_title: 'Administrators',
    super_admins_title: 'Super Admins',
    recent_users_title: 'Recent Users',
    recent_users_subtitle: 'Added in last 30 days',

    // User Form
    email_label: 'Email',
    department_label: 'Department',
    save_button: 'Save',
    cancel_button: 'Cancel',
    apply_button: 'Apply',
    user_details_title: 'User Details',
    permissions_title: 'Module Permissions',
    module_dashboard: 'Main Dashboard',
    module_plant_operations: 'Plant Operations',
    module_project_management: 'Project Management',
    permission_level_none: 'None',
    permission_level_read: 'View Only',
    permission_level_write: 'Can Edit',
    permission_level_admin: 'Admin',
    set_for_all_units: 'Set for all units...',

    // User Creation Success
    user_created_success_title: 'User Created Successfully!',
    user_created_success_message:
      'Account has been created successfully. Share these credentials securely.',
    temporary_password_label: 'Temporary Password',
    copy_password: 'Copy Password',
    copy_all_credentials: 'Copy All Credentials',
    send_email: 'Send Email',
    sending: 'Sending...',
    important_notice: 'Important Notice',
    password_change_notice:
      'The user must change their password on first login. Share these credentials securely through a secure channel.',
    user_updated_success: 'User updated successfully!',
    user_deleted_success: 'User deleted successfully!',
    user_not_found: 'User not found',
    cannot_delete_super_admin: 'Super Admin users cannot be deleted',
    only_super_admin_can_delete: 'Only Super Admin can delete users',
    confirm_delete_user: 'Are you sure you want to delete this user? This action cannot be undone.',
    delete_user: 'Delete User',
    close_button: 'Close',

    // Global Parameter Settings
    apply_to_all_users: 'Apply to All Users',
    super_admin_mode: 'Super Admin Mode',
    super_admin_global_settings_info: 'Settings you save will be applied to all system users.',
    global_settings_saved: 'Parameter settings have been applied to all users!',
    global_settings_save_failed: 'Failed to save global settings. Please try again.',

    // User Management Sub-Menu
    user_list: 'Users List',

    bulk_operations: 'Bulk Operations',
    user_audit: 'User Audit',

    // User Management Descriptions
    user_list_description: 'Manage and view all users in the system',

    // Roles Page
    users_with_role: 'users with this role',
    role_permissions: 'Role Permissions',
    select_role: 'Select Role',
    module: 'Module',
    permission_level: 'Permission Level',

    // Security Module
    overview: 'Overview',
    monitoring: 'Monitoring',
    audit: 'Audit Logs',
    gdpr: 'GDPR Compliance',
    roles: 'Role Management',
    mfa: 'MFA Management',

    // Plant Operations Dropdown & Page
    op_dashboard: 'Dashboard',
    op_optimized_dashboard: 'Optimized Dashboard',
    op_report: 'Report',
    op_wag_report: 'WhatsApp Group Report',
    op_ccr_data_entry: 'CCR Data Entry',
    op_autonomous_data_entry: 'Autonomous Data Entry',
    op_monitoring: 'Monitoring',
    op_forecast: 'Forecast',
    op_cop_analysis: 'COP Analysis',
    op_work_instruction_library: 'Work Instruction Library',
    op_master_data: 'Master Data',
    filters: 'Filters',
    filter_by_month: 'Filter by Month',
    filter_by_year: 'Filter by Year',
    month_jan: 'January',
    month_feb: 'February',
    month_mar: 'March',
    month_apr: 'April',
    month_may: 'May',
    month_jun: 'June',
    month_jul: 'July',
    month_aug: 'August',
    month_sep: 'September',
    month_oct: 'October',
    month_nov: 'November',
    month_dec: 'December',

    // Work Instruction Library
    activity: 'Activity',
    doc_code: 'Doc. Code',
    doc_title: 'Doc. Title',
    description: 'Description',
    link: 'Link',
    add_instruction_title: 'Add New Work Instruction',
    edit_instruction_title: 'Edit Work Instruction',

    // Plant Operations Report Page
    op_report_title: 'Daily Operational Report',
    generate_report_button: 'Generate Log Sheet',
    generate_report_subtitle: 'Logsheet Daily Report',
    generate_simple_data_button: 'Generate Simple Data',
    download_button: 'Download',
    download_as_image: 'Download as Image (.png)',
    download_as_pdf: 'Download as PDF (.pdf)',
    copy_image_button: 'Copy Image',
    copied_button_text: 'Copied!',
    report_for_date: 'Report for date',
    generating_report_message: 'Generating your report, please wait...',
    report_generated_success: 'Report generated. You can now download it.',
    no_report_parameters: 'No report parameters have been set in Master Data.',
    downtime_report_title: 'Downtime Report',
    silo_stock_report_title: 'Silo Stock Report',
    operator_report_title: 'Operator Report',

    // Plant Operations Master Data
    plant_unit_title: 'Plant Unit',
    plant_unit_subtitle: 'Plant units and categories',
    pic_setting_title: 'PIC Setting',
    pic_setting_subtitle: 'Person in charge settings',
    parameter_settings_title: 'Parameter Settings',
    parameter_settings_subtitle: 'Process parameters and validation rules',
    parameter_setting_title: 'Parameter Setting',
    parameter_setting_description: 'Configure parameter settings for plant operations',
    parameter_label: 'Parameter Name',
    parameter_placeholder: 'Enter parameter name',
    data_type_label: 'Data Type',
    unit_label_param: 'Unit',
    category_label: 'Category',
    select_unit: 'Select Unit',
    select_category: 'Select Category',
    min_value_label: 'Min Value',
    max_value_label: 'Max Value',
    basic_range_title: 'Basic Range Settings',
    silo_capacity_title: 'Silo Capacity',
    silo_capacity_subtitle: 'Storage capacity and dead stock management',
    silo_capacity_description: 'Configure silo capacity and dead stock management',
    plant_category_label_silo: 'Plant Category',
    silo_name_label: 'Silo Name',
    silo_name_placeholder: 'Enter silo name',
    capacity_label: 'Capacity (Ton)',
    dead_stock_label_silo: 'Dead Stock (Ton)',
    cop_parameters_title: 'COP Parameters',
    cop_parameters_subtitle: 'Critical operating parameters selection',
    report_settings_title: 'Report Settings',
    report_settings_subtitle: 'Report parameter ordering and configuration',
    report_settings_description: 'Configure report parameter ordering and display settings',
    simple_report_settings_title: 'Simple Report Settings',
    simple_report_settings_subtitle: 'Configure parameters for simple operational reports',
    add_simple_report_parameter_title: 'Add Simple Report Parameter',
    edit_simple_report_parameter_title: 'Edit Simple Report Parameter',
    parameter_select_label: 'Parameter',
    report_category_label: 'Category',
    unit: 'Plant Unit',
    parameter_id: 'Parameter ID',
    parameter: 'Parameter',
    data_type: 'Data Type',
    min_value: 'Min Value',
    max_value: 'Max Value',
    opc_min: 'OPC Min',
    opc_max: 'OPC Max',
    pcc_min: 'PCC Min',
    pcc_max: 'PCC Max',
    silo_lifestock: 'Silo Lifestock',
    order: 'Order',
    plant_category: 'Plant Category',
    category: 'Category',
    silo_name: 'Silo Name',
    capacity: 'Capacity',
    dead_stock: 'Dead Stock',

    // WhatsApp Group Report Translations
    wag_daily_report_title: '📊 *DAILY PRODUCTION REPORT* 📊',
    wag_shift1_report_title: '🌅 *SHIFT 1 PRODUCTION REPORT* 🌅',
    wag_shift2_report_title: '🌆 *SHIFT 2 PRODUCTION REPORT* 🌆',
    wag_shift3_report_title: '🌙 *SHIFT 3 PRODUCTION REPORT* 🌙',
    wag_plant_category: '🏭 *${category}*',
    wag_date: '📅 ${date}',
    wag_separator: '━━━━━━━━━━━━━━━━━━━━━',
    wag_daily_summary: '📈 *DAILY SUMMARY*',
    wag_shift1_summary: '� *RINGKASAN SHIFT 1*',
    wag_shift2_summary: '📊 *RINGKASAN SHIFT 2*',
    wag_shift3_summary: '📊 *RINGKASAN SHIFT 3*',
    wag_total_active_units: '├─ Total Active Units: ${count}',
    wag_total_production: '├─ Total Production: ${value} tons',
    wag_average_feed: '├─ Average Feed: ${value} tph',
    wag_total_operating_hours: '├─ Total Operating Hours: ${value} hours',
    wag_total_downtime: '└─ Total Downtime: ${value} hours',
    wag_unit_mill: '🏭 *UNIT MILL ${unit}*',
    wag_daily_production: '📈 *DAILY PRODUCTION* ${status}',
    wag_shift_production: '📈 *SHIFT PRODUCTION* ${status}',
    wag_product_type: '├─ Product Type: ${type}',
    wag_feed_rate: '├─ Feed Rate: ${value} tph',
    wag_operating_hours: '├─ Operating Hours: ${value} hours',
    wag_total_production_unit: '└─ Total Production: ${value} tons',
    wag_quality: '*QUALITY*',
    wag_material_usage: '*MATERIAL USAGE*',
    wag_feeder_settings: '*FEEDER SETTINGS*',
    wag_additional_notes: '⚠️ *ADDITIONAL NOTES*',
    wag_silo_status: '🏪 *CEMENT SILO STATUS*',
    wag_silo_empty: 'Empty',
    wag_silo_content: 'Content',
    wag_silo_fill: 'Fill',
    wag_closing_statement: '✅ *This concludes the daily report. Thank you.*',
    wag_shift_closing_statement: '✅ *This concludes the shift report. Thank you.*',
    wag_system_signature: '🔧 *SIPOMA - Production Monitoring System*',
    wag_shift1_title: 'SHIFT 1 (07:00 - 15:00)',
    wag_shift2_title: 'SHIFT 2 (15:00 - 23:00)',
    wag_shift3_title: 'SHIFT 3 (23:00 - 07:00)',
    wag_error_generating_report:
      '*Daily Production Report*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*',

    // Plant Operations CCR Data Entry
    ccr_data_entry_title: 'CCR Silo Data Entry',
    ccr_parameter_data_entry_title: 'CCR Parameter Data Entry',
    ccr_search_columns: 'Search Columns',
    ccr_search_placeholder: 'Search by parameter name or unit...',
    ccr_search_results: 'column found',
    ccr_search_results_plural: 'columns found',
    ccr_clear_search: 'Clear search',
    ccr_no_columns_match: 'No columns match your search',
    operator_name: 'Operator Name',
    hour: 'Hour',
    shift: 'Shift',
    shift_3_cont: 'Cont.',
    select_date: 'Select Date',
    shift_1: 'Shift 1',
    shift_2: 'Shift 2',
    shift_3: 'Shift 3',
    empty_space: 'Empty Space (m)',
    content: 'Content (Ton)',
    percentage: 'Percentage (%)',
    parameter_data: 'Parameter Data',
    material_usage: 'Material Usage',
    downtime_data_entry_title: 'Downtime Data Entry',
    information: 'Information',
    information_label: 'Additional information in operations',
    information_placeholder: 'Enter any information within operations',
    start_time: 'Start Time',
    end_time: 'End Time',
    pic: 'PIC',
    problem: 'Problem',
    add_downtime_button: 'Add Downtime',
    edit_downtime_title: 'Edit Downtime',
    add_downtime_title: 'Add Downtime',
    no_downtime_recorded: 'No downtime recorded for this date.',
    total: 'Total',
    average: 'Average',
    min: 'Min',
    max: 'Max',
    total_shift_1: 'Total Shift 1',
    total_shift_2: 'Total Shift 2',
    total_shift_3: 'Total Shift 3',
    total_shift_3_cont: 'Total Shift 3 (Cont.)',
    average_shift_1: 'Average Shift 1',
    average_shift_2: 'Average Shift 2',
    average_shift_3: 'Average Shift 3',
    average_shift_3_cont: 'Average Shift 3 (Cont.)',
    counter_shift_1: 'Counter Shift 1',
    counter_shift_2: 'Counter Shift 2',
    counter_shift_3: 'Counter Shift 3',
    counter_shift_3_cont: 'Counter Shift 3 (Cont.)',

    // Plant Operations Master Data
    add_plant_unit_title: 'Add Plant Unit',
    edit_plant_unit_title: 'Edit Plant Unit',
    unit_label: 'Unit Name',
    plant_category_label: 'Plant Category',
    unit_placeholder: 'Enter unit name (e.g., 220, 320)',
    category_placeholder: 'Enter plant category (e.g., Cement Mill, Raw Mill)',
    unit_required: 'Unit name is required',
    category_required: 'Plant category is required',
    unit_min_length: 'Unit must be at least 2 characters',
    category_min_length: 'Category must be at least 3 characters',
    invalid_characters: 'Invalid characters detected',
    save_success: 'Plant unit saved successfully!',
    saving: 'Saving...',
    form_help_title: 'Plant Unit Guidelines',
    unit_help: 'Unit should be unique within its category',
    category_help: 'Category groups related production units',
    naming_help: 'Use clear, descriptive names for easy identification',

    // CCR Data Entry specific keys
    ccr_material_usage_entry_title: 'CCR Material Usage Entry',
    loading_data: 'Loading data...',
    select_category_unit_date_first: 'Please select category, unit, and date first',
    select_unit_first: 'Please select Unit Name first before adding downtime.',
    failed_to_fetch_profiles: 'Failed to fetch profiles',
    profile_saved_successfully: 'Profile saved successfully',
    failed_to_save_profile: 'Failed to save profile',
    parameter_order_exported_successfully: 'Parameter order exported successfully',
    failed_to_export_parameter_order: 'Failed to export parameter order',
    invalid_excel_file_format: 'Invalid Excel file format',
    warning_some_parameters_not_imported: 'Warning: Some parameters could not be imported',
    parameter_order_imported_successfully: 'Parameter order imported successfully',
    failed_to_process_excel_file: 'Failed to process Excel file',
    failed_to_import_parameter_order: 'Failed to import parameter order',
    profile_loaded: 'Profile "{name}" loaded',
    failed_to_load_profile: 'Failed to load profile',
    invalid_profile_selected: 'Invalid profile selected',
    you_can_only_delete_own_profiles: 'You can only delete your own profiles',
    profile_deleted_successfully: 'Profile "{name}" deleted successfully',
    failed_to_delete_profile: 'Failed to delete profile',
    network_error_delete_profile: 'Failed to delete profile: Network or server error',
    error_fetching_parameter_data: 'Error fetching parameter data',
    no_parameter_data_found: 'No parameter data found for the selected date and unit.',
    no_plant_categories_found: 'No plant categories found in Master Data.',
    no_silo_master_data_found: 'No silo master data found for category: {category}.',
    no_parameter_master_data_found: 'No parameter master data found for unit: {unit}.',
    parameter_not_found: 'Parameter "{name}" not found in parameter settings for unit {unit}',
    choose_category: 'Choose Category',
    choose_unit: 'Choose Unit',

    // CCR Data Entry Modal Titles
    parameter_position_title: 'Enter parameter position number',
    search_columns_tooltip:
      'Search columns by parameter name or unit. Use Ctrl+F to focus, Escape to clear.',
    confirm_delete_downtime_title: 'Confirm Delete Downtime',
    reorder_parameters_title: 'Reorder Parameters',
    save_parameter_order_profile_title: 'Save Parameter Order Profile',
    load_parameter_order_profile_title: 'Load Parameter Order Profile',
    delete_parameter_order_profile_title: 'Delete Parameter Order Profile',

    // CCR Data Entry Section Descriptions
    ccr_silo_data_description: 'CCR silo data for capacity monitoring',
    ccr_material_usage_description: 'CCR material usage data for consumption monitoring',
    ccr_information_description: "Record important information related to today's CCR operations.",
    ccr_downtime_description:
      'Record downtime time and reasons for production efficiency analysis.',

    // CCR Data Entry Page Descriptions
    ccr_page_description: 'Manage CCR data for plant performance monitoring',
    ccr_parameter_section_description:
      'Ensure Plant Category and Plant Unit match the applied filters before filling parameter data.',

    // Autonomous Data Entry
    autonomous_downtime_follow_up: 'Downtime Follow-up',
    autonomous_risk_management: 'Risk Management',
    duration: 'Duration',
    action: 'Action',
    corrective_action: 'Corrective Action',
    edit_downtime_follow_up_title: 'Edit Downtime Follow-up',
    no_downtime_for_month: 'No downtime incidents recorded for the selected month.',
    potential_disruption: 'Potential Disruption',
    preventive_action: 'Preventive Action',
    risk_mitigation_plan: 'Risk Mitigation Plan',
    add_risk_button: 'Add Risk',
    edit_risk_title: 'Edit Risk',
    add_risk_title: 'Add New Risk',

    // Project Management
    proj_dashboard: 'Dashboard',
    proj_list: 'Project List',
    add_project: 'Add Project',
    edit_project: 'Edit Project',
    project_name: 'Project Name',
    project_name_placeholder: 'Enter project name...',
    confirm_delete: 'Confirm Delete',
    confirm_delete_project_message:
      'Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks.',
    add: 'Add',
    update: 'Update',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    select_project: 'Select Project',
    project_overview_title: 'Project Overview',
    project_tasks: 'Project Tasks',
    proj_duration: 'Project Duration',
    proj_total_tasks: 'Total Tasks',
    proj_budget: 'Budget',
    s_curve_chart_title: 'S-Curve Chart',
    gantt_chart_view: 'Gantt Chart',
    performance_summary_title: 'Performance Summary',
    overall_progress: 'Overall Progress',
    project_status: 'Project Status',
    current_deviation: 'Current Deviation',
    predicted_completion: 'Predicted Completion',
    task_details_title: 'Task Details',
    add_task_button: 'Add Task',
    edit_task_title: 'Edit Task',
    add_task_title: 'Add New Task',
    clear_filter_button: 'Clear Filter',
    active_tasks_header: 'Active Tasks:',
    // Project Dashboard
    project_dashboard_title: 'Projects Overview',
    total_projects: 'Total Projects',
    overall_progress_all: 'Overall Progress',
    projects_on_track: 'On Track',
    projects_delayed: 'Delayed',
    projects_completed_count: 'Completed',
    projects_by_status: 'Projects by Status',
    project_summary: 'Project Summary',
    view_details_button: 'View Details',
    upcoming_deadlines: 'Upcoming Deadlines (Next 7 Days)',
    no_upcoming_deadlines: 'No tasks are due in the next 7 days.',

    // Enhanced Dashboard Features
    financial_overview: 'Financial Overview',
    total_budget: 'Total Budget',
    budget_utilization: 'Budget Utilization',
    avg_project_budget: 'Average Project Budget',
    high_budget_projects: 'High Budget Projects',
    progress_trends: 'Progress Trends',
    monthly_progress: 'Monthly Progress',
    project_velocity: 'Project Velocity',
    completion_rate: 'Completion Rate',
    resource_allocation: 'Resource Allocation',
    active_tasks: 'Active Tasks',
    overdue_tasks: 'Overdue Tasks',
    tasks_due_today: 'Due Today',
    tasks_due_this_week: 'Due This Week',
    performance_analytics: 'Performance Analytics',
    efficiency_score: 'Efficiency Score',
    on_time_delivery: 'On-Time Delivery',
    risk_assessment: 'Risk Assessment',
    high_risk_projects: 'High Risk Projects',
    medium_risk_projects: 'Medium Risk Projects',
    low_risk_projects: 'Low Risk Projects',
    critical_issues: 'Critical Issues',
    projects_requiring_attention: 'Projects Requiring Attention',
    executive_insights: 'Executive Insights',
    recommendations: 'Key Recommendations',
    project_health_score: 'Project Health Score',
    team_productivity: 'Team Productivity',
    milestone_tracking: 'Milestone Tracking',
    upcoming_milestones: 'Upcoming Milestones',
    missed_milestones: 'Missed Milestones',
    budget_variance: 'Budget Variance',
    schedule_variance: 'Schedule Variance',
    quality_metrics: 'Quality Metrics',
    last_30_days: 'Last 30 Days',
    this_quarter: 'This Quarter',
    project_distribution: 'Project Distribution',
    workload_distribution: 'Workload Distribution',
    // Task Table Headers
    task_no: 'No.',
    task_activity: 'Activity',
    task_status: 'Status',
    task_weight: 'Weight (%)',
    task_planned_start: 'Planned Start',
    task_planned_end: 'Planned End',
    task_duration: 'Duration (Days)',
    task_actual_start: 'Actual Start',
    task_actual_end: 'Actual End',
    task_percent_complete: '% Complete',
    // Task Form
    activity_label: 'Activity',
    planned_start_label: 'Planned Start Date',
    planned_end_label: 'Planned End Date',
    actual_start_label: 'Actual Start Date',
    actual_end_label: 'Actual End Date',
    percent_complete_label: 'Percent Complete (%)',
    // Task Statuses
    status_not_started: 'Not Started',
    status_in_progress: 'In Progress',
    status_completed: 'Completed',
    // Project Statuses
    proj_status_on_track: 'On Track',
    proj_status_ahead: 'Ahead',
    proj_status_delayed: 'Delayed',
    proj_status_completed: 'Completed',
    // S-Curve Legend
    legend_planned_progress: 'Planned Progress',
    legend_actual_progress: 'Actual Progress',

    // Placeholder
    under_construction: 'This module is under construction.',

    // Access Control
    access_denied: '',
    back_to_dashboard: 'Back to Dashboard',

    // COP Analysis
    qaf_daily: 'QAF Daily',
    qaf_tooltip: '{inRange} of {total} parameters in range',

    // Footer
    footer_copyright: 'SIPOMA. All Rights Reserved.',
    footer_terms: 'Terms of Service',
    footer_privacy: 'Privacy Policy',
    footer_contact: 'Contact Us',

    // Error Boundary
    error_title: 'An Error Occurred',
    error_message: 'Sorry, an error occurred while loading this component.',
    error_retry: 'Try Again',

    // Login
    login_username_required: 'Username is required',
    login_password_required: 'Password is required',
    login_username_label: 'Username',
    login_password_label: 'Password',
    login_logging_in: 'Logging in...',
    login_guest_button: 'Login as Guest',
    login_guest_error: 'Guest login failed. Please try regular login.',
    login_subtitle: 'Smart Integrated Plant Operations Management Application',
    login_no_account: "Don't have an account?",
    login_register_here: 'Register here',
    login_copyright: 'All rights reserved.',

    // Registration
    registration_name_required: 'Full name is required',
    registration_email_required: 'Email is required',
    registration_email_invalid: 'Invalid email format',
    registration_success: 'Registration Request Successful!',
  },
  id: {
    // Header & Navigation
    appTitle: 'SIPOMA',
    appSubtitle: 'Sistem Informasi Produksi Manajemen',
    header_welcome: 'Selamat Datang',
    mainDashboard: 'Dasbor Utama',
    plantOperations: 'Operasi Pabrik',
    inspection: 'Inspeksi',
    projectManagement: 'Manajemen Proyek',
    userManagement: 'Manajemen Pengguna',
    permissions: 'Hak Akses',
    close: 'Tutup',
    full_name_label: 'Nama Lengkap',
    user_is_active_label: 'Pengguna Aktif',
    add_user_button: 'Tambah Pengguna',
    header_settings: 'Pengaturan',
    header_audit_trail: 'Jejak Audit',
    login_title: 'Masuk ke akun Anda',
    username: 'Nama Pengguna',
    password: 'Kata Sandi',
    sign_in: 'Masuk',
    loading: 'Sedang masuk...',
    login_error: 'Nama pengguna atau kata sandi tidak valid',
    header_help_support: 'Bantuan & Dukungan',
    theme_toggle: 'Tema',
    theme_light: 'Terang',
    header_sign_out: 'Keluar',

    // Tooltips
    tooltip_toggle_menu: 'Buka/tutup menu navigasi',
    tooltip_add_user: 'Buat akun pengguna baru',
    tooltip_switch_light: 'Ubah ke mode terang',
    tooltip_notifications: 'Lihat notifikasi',
    tooltip_notifications_unread: '{count} notifikasi belum dibaca',
    tooltip_sign_out: 'Keluar dari aplikasi',
    tooltip_open_user_menu: 'Profil & pengaturan {name}',
    tooltip_close_user_menu: 'Tutup menu pengguna',

    // Inspection Module
    insp_dashboard: 'Dasbor',
    insp_form: 'Inspeksi Baru',
    insp_details: 'Detail Inspeksi',
    insp_reports: 'Laporan',

    // Inspection Tabs
    insp_tab_general: 'Inspeksi Umum',
    insp_tab_hose_valve_blasting: 'Hose & Valve Blasting MBF',
    insp_tab_safety: 'Checklist Keselamatan',
    insp_tab_documentation: 'Dokumentasi',

    // Hose & Valve Blasting MBF Form
    hose_valve_blasting_title: 'Inspeksi Hose & Valve Blasting MBF',
    hose_valve_blasting_description:
      'Lengkapi formulir inspeksi untuk peralatan hose dan valve blasting',
    equipment_information: 'Informasi Peralatan',
    test_parameters: 'Parameter Uji',
    additional_notes: 'Catatan Tambahan',
    equipment_id: 'ID Peralatan',
    pressure_rating: 'Rating Tekanan (PSI)',
    hose_condition: 'Kondisi Hose',
    valve_condition: 'Kondisi Valve',
    blast_pressure: 'Tekanan Blast (PSI)',
    temperature: 'Suhu (°C)',
    inspection_date: 'Tanggal Inspeksi',
    inspector_name: 'Nama Inspector',
    certification_number: 'Nomor Sertifikat',
    remarks: 'Keterangan',
    select_condition: 'Pilih kondisi',
    condition_excellent: 'Sangat Baik',
    condition_good: 'Baik',
    condition_fair: 'Cukup',
    condition_poor: 'Buruk',
    save_inspection: 'Simpan Inspeksi',
    reset_form: 'Reset Formulir',
    inspection_saved: 'Data inspeksi disimpan!',

    // Notifications
    notifications_title: 'Notifikasi',
    mark_all_as_read: 'Tandai semua dibaca',
    view_all_notifications: 'Lihat semua notifikasi',
    no_new_notifications: 'Tidak ada notifikasi baru',
    notification_settings: 'Pengaturan Notifikasi',
    browser_notifications: 'Notifikasi Browser',
    sound_alerts: 'Suara Peringatan',
    critical_only: 'Hanya Kritis',
    snooze_notification: 'Tunda',
    dismiss_notification: 'Tutup',
    mark_as_read: 'Tandai dibaca',

    // Main Dashboard
    dashboard_welcome_title: 'Selamat Datang di SIPOMA',
    dashboard_welcome_subtitle:
      'Pusat kendali Anda untuk manajemen manufaktur semen. Berikut adalah ringkasan singkat sistem.',
    quote_of_the_day: 'Quote Hari Ini',
    // Daily Quotes
    daily_quotes: [
      {
        content:
          'Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang Anda lakukan.',
        author: 'Steve Jobs',
      },
      { content: 'Inovasi membedakan antara pemimpin dan pengikut.', author: 'Steve Jobs' },
      {
        content: 'Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya.',
        author: 'Peter Drucker',
      },
      { content: 'Kualitas bukanlah sebuah tindakan, itu adalah kebiasaan.', author: 'Aristotle' },
      {
        content: 'Satu-satunya batas untuk mewujudkan hari esok adalah keraguan kita hari ini.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Keunggulan bukanlah sebuah keterampilan. Itu adalah sikap.',
        author: 'Ralph Marston',
      },
      {
        content:
          'Kesuksesan bukanlah akhir, kegagalan bukanlah fatal: Yang penting adalah keberanian untuk melanjutkan.',
        author: 'Winston Churchill',
      },
      {
        content: 'Masa depan milik mereka yang percaya pada keindahan impian mereka.',
        author: 'Eleanor Roosevelt',
      },
      {
        content: 'Percayalah bahwa Anda bisa dan Anda sudah setengah jalan.',
        author: 'Theodore Roosevelt',
      },
      {
        content: 'Cara untuk memulai adalah berhenti bicara dan mulai bertindak.',
        author: 'Walt Disney',
      },
      {
        content: 'Waktu Anda terbatas, jadi jangan sia-siakan dengan menjalani hidup orang lain.',
        author: 'Steve Jobs',
      },
      {
        content: 'Masa depan tergantung pada apa yang Anda lakukan hari ini.',
        author: 'Mahatma Gandhi',
      },
      { content: 'Anda melewatkan 100% tembakan yang tidak Anda ambil.', author: 'Wayne Gretzky' },
      { content: 'Balas dendam terbaik adalah kesuksesan besar.', author: 'Frank Sinatra' },
      {
        content: 'Perjalanan yang mustahil adalah perjalanan yang tidak pernah Anda mulai.',
        author: 'Tony Robbins',
      },
      {
        content: 'Jangan menonton jam; lakukan apa yang dilakukannya. Teruslah berjalan.',
        author: 'Sam Levenson',
      },
      { content: 'Rahasia maju adalah memulai.', author: 'Mark Twain' },
      {
        content:
          'Selalu arahkan wajah Anda ke arah sinar matahari—dan bayangan akan jatuh di belakang Anda.',
        author: 'Walt Whitman',
      },
      {
        content:
          'Semakin keras Anda bekerja untuk sesuatu, semakin besar perasaan Anda saat mencapainya.',
        author: 'Anonim',
      },
      { content: 'Impikan yang lebih besar. Lakukan yang lebih besar.', author: 'Anonim' },
      { content: 'Jangan berhenti saat Anda lelah. Berhenti saat Anda selesai.', author: 'Anonim' },
      { content: 'Bangun dengan tekad. Tidur dengan kepuasan.', author: 'Anonim' },
      {
        content: 'Lakukan sesuatu hari ini yang akan disyukuri diri Anda di masa depan.',
        author: 'Anonim',
      },
      { content: 'Hal-hal kecil membuat hari-hari besar.', author: 'Anonim' },
      { content: 'Ini akan sulit, tapi sulit tidak berarti mustahil.', author: 'Anonim' },
      { content: 'Jangan tunggu kesempatan. Ciptakan itu.', author: 'Anonim' },
      {
        content:
          'Kadang kita diuji bukan untuk menunjukkan kelemahan kita, tapi untuk menemukan kekuatan kita.',
        author: 'Anonim',
      },
      {
        content:
          'Kunci kesuksesan adalah fokuskan pikiran sadar Anda pada hal-hal yang Anda inginkan, bukan hal-hal yang Anda takuti.',
        author: 'Brian Tracy',
      },
      {
        content: 'Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan.',
        author: 'Albert Schweitzer',
      },
      {
        content: 'Satu-satunya tempat di mana kesuksesan datang sebelum kerja adalah di kamus.',
        author: 'Vidal Sassoon',
      },
      {
        content:
          'Pelanggan Anda yang paling tidak bahagia adalah sumber pembelajaran terbesar Anda.',
        author: 'Bill Gates',
      },
      {
        content: 'Cara terbaik untuk memprediksi masa depan Anda adalah menciptakannya.',
        author: 'Abraham Lincoln',
      },
      {
        content: 'Perbedaan antara biasa dan luar biasa adalah sedikit ekstra itu.',
        author: 'Jimmy Johnson',
      },
      {
        content: 'Cara mengembangkan kepercayaan diri adalah melakukan hal yang Anda takuti.',
        author: 'William Jennings Bryan',
      },
      {
        content: 'Prajurit yang sukses adalah orang biasa, dengan fokus seperti laser.',
        author: 'Bruce Lee',
      },
      {
        content:
          'Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang Anda lakukan.',
        author: 'Steve Jobs',
      },
      { content: 'Inovasi membedakan antara pemimpin dan pengikut.', author: 'Steve Jobs' },
      { content: 'Tetaplah lapar, tetaplah bodoh.', author: 'Steve Jobs' },
      {
        content:
          'Pekerjaan Anda akan mengisi sebagian besar hidup Anda, dan satu-satunya cara untuk benar-benar puas adalah melakukan apa yang Anda percaya sebagai pekerjaan hebat.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Orang-orang yang cukup gila untuk berpikir mereka bisa mengubah dunia adalah orang-orang yang melakukannya.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Desain bukan hanya seperti apa rupanya dan rasanya. Desain adalah bagaimana cara kerjanya.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Kualitas lebih penting daripada kuantitas. Satu home run jauh lebih baik daripada dua double.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Saya yakin bahwa sekitar setengah dari apa yang memisahkan pengusaha sukses dari yang tidak sukses adalah ketekunan murni.',
        author: 'Steve Jobs',
      },
      { content: 'Miliki keberanian untuk mengikuti hati dan intuisi Anda.', author: 'Steve Jobs' },
      {
        content: 'Kadang hidup memukul kepala Anda dengan batu bata. Jangan kehilangan iman.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Anda tidak bisa menghubungkan titik-titik ke depan; Anda hanya bisa menghubungkannya ke belakang.',
        author: 'Steve Jobs',
      },
      { content: 'Kreativitas hanyalah menghubungkan hal-hal.', author: 'Steve Jobs' },
      { content: 'Sederhana bisa lebih sulit daripada kompleks.', author: 'Steve Jobs' },
      {
        content: 'Hal-hal tidak harus mengubah dunia untuk menjadi penting.',
        author: 'Steve Jobs',
      },
      { content: 'Saya ingin membuat dent di alam semesta.', author: 'Steve Jobs' },
      { content: 'Orang paling kuat di dunia adalah pencerita.', author: 'Steve Jobs' },
      { content: 'Teknologi saja tidak cukup.', author: 'Steve Jobs' },
      { content: 'Perjalanan adalah imbalannya.', author: 'Peribahasa Cina' },
      { content: 'Perjalanan seribu mil dimulai dengan langkah tunggal.', author: 'Lao Tzu' },
      {
        content:
          'Waktu terbaik untuk menanam pohon adalah 20 tahun yang lalu. Waktu terbaik kedua adalah sekarang.',
        author: 'Peribahasa Cina',
      },
      {
        content:
          'Jangan tinggal di masa lalu, jangan bermimpi tentang masa depan, konsentrasikan pikiran pada saat ini.',
        author: 'Buddha',
      },
      { content: 'Kedamaian datang dari dalam. Jangan cari di luar.', author: 'Buddha' },
      {
        content: 'Semua yang kita adalah adalah hasil dari apa yang telah kita pikirkan.',
        author: 'Buddha',
      },
      {
        content: 'Pikiran adalah segalanya. Apa yang Anda pikirkan Anda menjadi.',
        author: 'Buddha',
      },
      {
        content:
          'Kebahagiaan tidak akan pernah datang kepada mereka yang gagal menghargai apa yang sudah mereka miliki.',
        author: 'Anonim',
      },
      {
        content:
          'Kemuliaan terbesar dalam hidup terletak bukan pada tidak pernah jatuh, tapi bangun setiap kali kita jatuh.',
        author: 'Nelson Mandela',
      },
      {
        content: 'Cara untuk memulai adalah berhenti bicara dan mulai bertindak.',
        author: 'Walt Disney',
      },
      {
        content: 'Waktu Anda terbatas, jadi jangan sia-siakan dengan menjalani hidup orang lain.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Jika hidup dapat diprediksi maka itu akan berhenti menjadi hidup, dan tanpa rasa.',
        author: 'Eleanor Roosevelt',
      },
      {
        content:
          'Jika Anda melihat apa yang Anda miliki dalam hidup, Anda akan selalu memiliki lebih.',
        author: 'Oprah Winfrey',
      },
      {
        content:
          'Jika Anda menetapkan tujuan Anda sangat tinggi dan itu gagal, Anda akan gagal di atas kesuksesan orang lain.',
        author: 'James Cameron',
      },
      {
        content: 'Hidup adalah apa yang terjadi pada Anda saat Anda sibuk membuat rencana lain.',
        author: 'John Lennon',
      },
      {
        content:
          'Sebarkan cinta ke mana pun Anda pergi. Jangan biarkan siapa pun datang kepada Anda tanpa pergi lebih bahagia.',
        author: 'Mother Teresa',
      },
      {
        content: 'Ketika Anda mencapai ujung tali Anda, ikat simpul di dalamnya dan bertahanlah.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Selalu ingat bahwa Anda benar-benar unik. Sama seperti orang lain.',
        author: 'Margaret Mead',
      },
      {
        content:
          'Jangan nilai setiap hari dengan panen yang Anda tuai tapi dengan biji yang Anda tanam.',
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'Masa depan milik mereka yang percaya pada keindahan impian mereka.',
        author: 'Eleanor Roosevelt',
      },
      {
        content:
          'Katakan padaku dan aku lupa. Ajari aku dan aku ingat. Libatkan aku dan aku belajar.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'Hal-hal terbaik dan paling indah di dunia tidak dapat dilihat atau bahkan disentuh - mereka harus dirasakan dengan hati.',
        author: 'Helen Keller',
      },
      {
        content: 'Selama momen tergelap kita, kita harus fokus untuk melihat cahaya.',
        author: 'Aristotle',
      },
      {
        content: 'Siapa pun yang bahagia akan membuat orang lain bahagia juga.',
        author: 'Anne Frank',
      },
      {
        content:
          'Jangan pergi ke mana jalan mungkin membawa, pergilah ke tempat tidak ada jalan dan tinggalkan jejak.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content:
          'Anda akan menghadapi banyak kekalahan dalam hidup, tapi jangan pernah biarkan diri Anda dikalahkan.',
        author: 'Maya Angelou',
      },
      {
        content:
          'Kemuliaan terbesar dalam hidup terletak bukan pada tidak pernah jatuh, tapi bangun setiap kali kita jatuh.',
        author: 'Nelson Mandela',
      },
      {
        content:
          'Pada akhirnya, bukan tahun-tahun dalam hidup Anda yang berhitung. Itu adalah hidup dalam tahun-tahun Anda.',
        author: 'Abraham Lincoln',
      },
      {
        content: 'Jangan pernah biarkan ketakutan strike out membuat Anda tidak bermain game.',
        author: 'Babe Ruth',
      },
      {
        content: 'Hidup adalah petualangan yang berani atau tidak sama sekali.',
        author: 'Helen Keller',
      },
      {
        content:
          'Banyak kegagalan hidup adalah orang-orang yang tidak menyadari betapa dekatnya mereka dengan kesuksesan saat mereka menyerah.',
        author: 'Thomas A. Edison',
      },
      {
        content: 'Cara untuk memulai adalah berhenti bicara dan mulai bertindak.',
        author: 'Walt Disney',
      },
      {
        content: 'Waktu Anda terbatas, jadi jangan sia-siakan dengan menjalani hidup orang lain.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Jika hidup dapat diprediksi maka itu akan berhenti menjadi hidup, dan tanpa rasa.',
        author: 'Eleanor Roosevelt',
      },
      {
        content:
          'Jika Anda melihat apa yang Anda miliki dalam hidup, Anda akan selalu memiliki lebih.',
        author: 'Oprah Winfrey',
      },
      {
        content:
          'Jika Anda menetapkan tujuan Anda sangat tinggi dan itu gagal, Anda akan gagal di atas kesuksesan orang lain.',
        author: 'James Cameron',
      },
      {
        content: 'Hidup adalah apa yang terjadi pada Anda saat Anda sibuk membuat rencana lain.',
        author: 'John Lennon',
      },
      {
        content:
          'Sebarkan cinta ke mana pun Anda pergi. Jangan biarkan siapa pun datang kepada Anda tanpa pergi lebih bahagia.',
        author: 'Mother Teresa',
      },
      {
        content: 'Ketika Anda mencapai ujung tali Anda, ikat simpul di dalamnya dan bertahanlah.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Selalu ingat bahwa Anda benar-benar unik. Sama seperti orang lain.',
        author: 'Margaret Mead',
      },
      {
        content:
          'Jangan nilai setiap hari dengan panen yang Anda tuai tapi dengan biji yang Anda tanam.',
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'Masa depan milik mereka yang percaya pada keindahan impian mereka.',
        author: 'Eleanor Roosevelt',
      },
      {
        content:
          'Katakan padaku dan aku lupa. Ajari aku dan aku ingat. Libatkan aku dan aku belajar.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'Hal-hal terbaik dan paling indah di dunia tidak dapat dilihat atau bahkan disentuh - mereka harus dirasakan dengan hati.',
        author: 'Helen Keller',
      },
      {
        content: 'Selama momen tergelap kita, kita harus fokus untuk melihat cahaya.',
        author: 'Aristotle',
      },
      {
        content: 'Siapa pun yang bahagia akan membuat orang lain bahagia juga.',
        author: 'Anne Frank',
      },
      {
        content:
          'Jangan pergi ke mana jalan mungkin membawa, pergilah ke tempat tidak ada jalan dan tinggalkan jejak.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content:
          'Anda akan menghadapi banyak kekalahan dalam hidup, tapi jangan pernah biarkan diri Anda dikalahkan.',
        author: 'Maya Angelou',
      },
      {
        content:
          'Kemuliaan terbesar dalam hidup terletak bukan pada tidak pernah jatuh, tapi bangun setiap kali kita jatuh.',
        author: 'Nelson Mandela',
      },
      {
        content:
          'Pada akhirnya, bukan tahun-tahun dalam hidup Anda yang berhitung. Itu adalah hidup dalam tahun-tahun Anda.',
        author: 'Abraham Lincoln',
      },
      {
        content: 'Jangan pernah biarkan ketakutan strike out membuat Anda tidak bermain game.',
        author: 'Babe Ruth',
      },
      {
        content: 'Hidup adalah petualangan yang berani atau tidak sama sekali.',
        author: 'Helen Keller',
      },
      {
        content:
          'Banyak kegagalan hidup adalah orang-orang yang tidak menyadari betapa dekatnya mereka dengan kesuksesan saat mereka menyerah.',
        author: 'Thomas A. Edison',
      },
      {
        content: 'Cara untuk memulai adalah berhenti bicara dan mulai bertindak.',
        author: 'Walt Disney',
      },
      {
        content: 'Waktu Anda terbatas, jadi jangan sia-siakan dengan menjalani hidup orang lain.',
        author: 'Steve Jobs',
      },
      {
        content:
          'Jika hidup dapat diprediksi maka itu akan berhenti menjadi hidup, dan tanpa rasa.',
        author: 'Eleanor Roosevelt',
      },
      {
        content:
          'Jika Anda melihat apa yang Anda miliki dalam hidup, Anda akan selalu memiliki lebih.',
        author: 'Oprah Winfrey',
      },
      {
        content:
          'Jika Anda menetapkan tujuan Anda sangat tinggi dan itu gagal, Anda akan gagal di atas kesuksesan orang lain.',
        author: 'James Cameron',
      },
      {
        content: 'Hidup adalah apa yang terjadi pada Anda saat Anda sibuk membuat rencana lain.',
        author: 'John Lennon',
      },
      {
        content:
          'Sebarkan cinta ke mana pun Anda pergi. Jangan biarkan siapa pun datang kepada Anda tanpa pergi lebih bahagia.',
        author: 'Mother Teresa',
      },
      {
        content: 'Ketika Anda mencapai ujung tali Anda, ikat simpul di dalamnya dan bertahanlah.',
        author: 'Franklin D. Roosevelt',
      },
      {
        content: 'Selalu ingat bahwa Anda benar-benar unik. Sama seperti orang lain.',
        author: 'Margaret Mead',
      },
      {
        content:
          'Jangan nilai setiap hari dengan panen yang Anda tuai tapi dengan biji yang Anda tanam.',
        author: 'Robert Louis Stevenson',
      },
      {
        content: 'Masa depan milik mereka yang percaya pada keindahan impian mereka.',
        author: 'Eleanor Roosevelt',
      },
      {
        content:
          'Katakan padamu dan aku lupa. Ajari aku dan aku ingat. Libatkan aku dan aku belajar.',
        author: 'Benjamin Franklin',
      },
      {
        content:
          'Hal-hal terbaik dan paling indah di dunia tidak dapat dilihat atau bahkan disentuh - mereka harus dirasakan dengan hati.',
        author: 'Helen Keller',
      },
      {
        content: 'Selama momen tergelap kita, kita harus fokus untuk melihat cahaya.',
        author: 'Aristotle',
      },
      {
        content: 'Siapa pun yang bahagia akan membuat orang lain bahagia juga.',
        author: 'Anne Frank',
      },
      {
        content:
          'Jangan pergi ke mana jalan mungkin membawa, pergilah ke tempat tidak ada jalan dan tinggalkan jejak.',
        author: 'Ralph Waldo Emerson',
      },
      {
        content:
          'Anda akan menghadapi banyak kekalahan dalam hidup, tapi jangan pernah biarkan diri Anda dikalahkan.',
        author: 'Maya Angelou',
      },
      {
        content:
          'Kemuliaan terbesar dalam hidup terletak bukan pada tidak pernah jatuh, tapi bangun setiap kali kita jatuh.',
        author: 'Nelson Mandela',
      },
      {
        content:
          'Pada akhirnya, bukan tahun-tahun dalam hidup Anda yang berhitung. Itu adalah hidup dalam tahun-tahun Anda.',
        author: 'Abraham Lincoln',
      },
      {
        content: 'Jangan pernah biarkan ketakutan strike out membuat Anda tidak bermain game.',
        author: 'Babe Ruth',
      },
      {
        content: 'Hidup adalah petualangan yang berani atau tidak sama sekali.',
        author: 'Helen Keller',
      },
      {
        content:
          'Banyak kegagalan hidup adalah orang-orang yang tidak menyadari betapa dekatnya mereka dengan kesuksesan saat mereka menyerah.',
        author: 'Thomas A. Edison',
      },
    ],
    dashboard_quick_stats_title: 'Statistik Cepat',
    stat_active_users: 'Pengguna Aktif',
    stat_online_users: 'Pengguna Online',
    stat_plant_oee: 'OEE Pabrik Keseluruhan',
    stat_active_projects: 'Proyek Aktif',
    dashboard_quick_links_title: 'Tautan Cepat',
    link_plant_dashboard: 'Lihat Dasbor Pabrik',
    link_project_board: 'Buka Papan Proyek',

    // Main Dashboard Charts
    performance_overview_title: 'Ringkasan Kinerja',
    performance_overview_subtitle: 'Metrik produksi dan efisiensi real-time',
    project_status_title: 'Status Proyek',
    project_status_subtitle: '{count} proyek aktif',
    active_projects_title: 'Proyek Aktif',
    total_production_title: 'Total Produksi',

    // Settings Page
    settings_page_subtitle: 'Kelola preferensi akun dan detail profil Anda di sini.',
    profile_information: 'Informasi Profil',
    change_password: 'Ubah Kata Sandi',
    current_password: 'Kata Sandi Saat Ini',
    new_password: 'Kata Sandi Baru',
    confirm_password: 'Konfirmasi Kata Sandi Baru',
    save_password: 'Simpan Kata Sandi',
    password_updated: 'Kata sandi berhasil diperbarui!',
    password_no_match: 'Kata sandi baru tidak cocok.',
    language_settings: 'Pengaturan Bahasa',
    language: 'Bahasa',
    notifications: 'Notifikasi',
    push_notifications_project: 'Pengingat Tenggat Proyek',
    push_notifications_project_desc:
      'Dapatkan notifikasi push untuk tenggat waktu tugas proyek yang akan datang.',
    edit_profile: 'Ubah Profil',
    save_changes: 'Simpan Perubahan',
    edit_profile_title: 'Ubah Profil',
    upload_avatar: 'Unggah Avatar',
    avatar_updated: 'Profil berhasil diperbarui!',
    upload_avatar_error_size: 'Ukuran file harus kurang dari 5MB',
    upload_avatar_error_type: 'File harus berupa gambar (JPEG, PNG, GIF, atau WebP)',
    upload_avatar_error_upload: 'Gagal mengunggah gambar',
    uploading: 'Mengunggah...',

    // Sign Out Modal
    confirm_sign_out_title: 'Konfirmasi Keluar',
    confirm_sign_out_message: 'Apakah Anda yakin ingin keluar?',

    // User Management Page
    name: 'Nama',
    role: 'Peran',
    role_label: 'Peran',
    status: 'Status',
    last_active: 'Terakhir Aktif',
    actions: 'Aksi',
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    edit_user_title: 'Ubah Pengguna',
    add_user_title: 'Tambah Pengguna Baru',

    // User Management Statistics
    total_users_title: 'Total Pengguna',
    active_users_title: 'Pengguna Aktif',
    inactive_users_title: 'Pengguna Tidak Aktif',
    administrators_title: 'Administrator',
    super_admins_title: 'Super Admin',
    recent_users_title: 'Pengguna Terbaru',
    recent_users_subtitle: 'Ditambahkan dalam 30 hari terakhir',

    // User Form
    email_label: 'Email',
    department_label: 'Departemen',
    save_button: 'Simpan',
    cancel_button: 'Batal',
    apply_button: 'Terapkan',
    user_details_title: 'Detail Pengguna',
    permissions_title: 'Hak Akses Modul',
    module_dashboard: 'Dasbor Utama',
    module_plant_operations: 'Operasi Pabrik',
    module_project_management: 'Manajemen Proyek',
    permission_level_none: 'Tidak Ada Akses',
    permission_level_read: 'Hanya Lihat',
    permission_level_write: 'Dapat Edit',
    permission_level_admin: 'Admin',
    set_for_all_units: 'Atur untuk semua unit...',

    // User Creation Success
    user_created_success_title: 'Pengguna Berhasil Dibuat!',
    user_created_success_message: 'Akun telah berhasil dibuat. Bagikan kredensial ini dengan aman.',
    temporary_password_label: 'Kata Sandi Sementara',
    copy_password: 'Salin Kata Sandi',
    copy_all_credentials: 'Salin Semua Kredensial',
    send_email: 'Kirim Email',
    sending: 'Mengirim...',
    important_notice: 'Pemberitahuan Penting',
    password_change_notice:
      'Pengguna harus mengubah kata sandi mereka saat login pertama. Bagikan kredensial ini dengan aman melalui saluran yang aman.',
    user_updated_success: 'Pengguna berhasil diperbarui!',
    user_deleted_success: 'Pengguna berhasil dihapus!',
    user_not_found: 'Pengguna tidak ditemukan',
    cannot_delete_super_admin: 'Pengguna Super Admin tidak dapat dihapus',
    only_super_admin_can_delete: 'Hanya Super Admin yang dapat menghapus pengguna',
    confirm_delete_user:
      'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.',
    delete_user: 'Hapus Pengguna',
    close_button: 'Tutup',

    // Global Parameter Settings
    apply_to_all_users: 'Terapkan ke Semua Pengguna',
    super_admin_mode: 'Mode Super Admin',
    super_admin_global_settings_info:
      'Pengaturan yang Anda simpan akan diterapkan ke semua pengguna sistem.',
    global_settings_saved: 'Pengaturan parameter telah diterapkan ke semua pengguna!',
    global_settings_save_failed: 'Gagal menyimpan pengaturan global. Silahkan coba lagi.',

    // User Management Sub-Menu
    user_list: 'Daftar Pengguna',

    bulk_operations: 'Operasi Massal',
    user_audit: 'Audit Pengguna',

    // User Management Descriptions
    user_list_description: 'Kelola dan lihat semua pengguna dalam sistem',

    // Roles Page
    users_with_role: 'pengguna dengan peran ini',
    role_permissions: 'Izin Peran',
    select_role: 'Pilih Peran',
    module: 'Modul',
    permission_level: 'Level Izin',

    // Security Module
    overview: 'Ikhtisar',
    monitoring: 'Pemantauan',
    audit: 'Log Audit',
    gdpr: 'Kepatuhan GDPR',
    roles: 'Manajemen Peran',
    mfa: 'Manajemen MFA',

    // Plant Operations Dropdown & Page
    op_dashboard: 'Dasbor',
    op_optimized_dashboard: 'Dasbor Teroptimasi',
    op_report: 'Laporan',
    op_wag_report: 'Laporan WhatsApp Group',
    op_ccr_data_entry: 'Entri Data CCR',
    op_autonomous_data_entry: 'Entri Data Autonomous',
    op_monitoring: 'Monitoring',
    op_forecast: 'Perkiraan',
    op_cop_analysis: 'Analisis COP',
    op_work_instruction_library: 'Pustaka Instruksi Kerja',
    op_master_data: 'Data Master',
    filters: 'Filter',
    filter_by_month: 'Filter berdasarkan Bulan',
    filter_by_year: 'Filter berdasarkan Tahun',
    month_jan: 'Januari',
    month_feb: 'Februari',
    month_mar: 'Maret',
    month_apr: 'April',
    month_may: 'Mei',
    month_jun: 'Juni',
    month_jul: 'Juli',
    month_aug: 'Agustus',
    month_sep: 'September',
    month_oct: 'Oktober',
    month_nov: 'November',
    month_dec: 'Desember',

    // Work Instruction Library
    activity: 'Aktivitas',
    doc_code: 'Kode Dok.',
    doc_title: 'Judul Dok.',
    description: 'Deskripsi',
    link: 'Tautan',
    add_instruction_title: 'Tambah Instruksi Kerja Baru',
    edit_instruction_title: 'Ubah Instruksi Kerja',

    // Plant Operations Report Page
    op_report_title: 'Laporan Operasional Harian',
    generate_report_button: 'Buat Log Sheet',
    generate_report_subtitle: 'Logsheet Laporan Harian',
    generate_simple_data_button: 'Buat Data Sederhana',
    download_button: 'Unduh',
    download_as_image: 'Unduh sebagai Gambar (.png)',
    download_as_pdf: 'Unduh sebagai PDF (.pdf)',
    copy_image_button: 'Salin Gambar',
    copied_button_text: 'Tersalin!',
    report_for_date: 'Laporan tanggal',
    generating_report_message: 'Sedang membuat laporan Anda, harap tunggu...',
    report_generated_success: 'Laporan berhasil dibuat. Anda sekarang dapat mengunduhnya.',
    no_report_parameters: 'Tidak ada parameter laporan yang diatur di Data Master.',
    downtime_report_title: 'Laporan Waktu Henti',
    silo_stock_report_title: 'Laporan Stok Silo',
    operator_report_title: 'Laporan Operator',

    // Plant Operations Master Data
    plant_unit_title: 'Unit Pabrik',
    plant_unit_subtitle: 'Unit pabrik dan kategori',
    pic_setting_title: 'Pengaturan PIC',
    pic_setting_subtitle: 'Pengaturan person in charge',
    parameter_settings_title: 'Pengaturan Parameter',
    parameter_settings_subtitle: 'Parameter proses dan aturan validasi',
    parameter_setting_title: 'Pengaturan Parameter',
    parameter_setting_description: 'Konfigurasi pengaturan parameter untuk operasi pabrik',
    parameter_label: 'Nama Parameter',
    parameter_placeholder: 'Masukkan nama parameter',
    data_type_label: 'Tipe Data',
    unit_label_param: 'Unit',
    category_label: 'Kategori',
    select_unit: 'Pilih Unit',
    select_category: 'Pilih Kategori',
    min_value_label: 'Nilai Min',
    max_value_label: 'Nilai Max',
    basic_range_title: 'Pengaturan Rentang Dasar',
    silo_capacity_title: 'Kapasitas Silo',
    silo_capacity_subtitle: 'Kapasitas penyimpanan dan manajemen stok mati',
    silo_capacity_description: 'Konfigurasi kapasitas silo dan manajemen stok mati',
    plant_category_label_silo: 'Kategori Pabrik',
    silo_name_label: 'Nama Silo',
    silo_name_placeholder: 'Masukkan nama silo',
    capacity_label: 'Kapasitas (Ton)',
    dead_stock_label_silo: 'Stok Mati (Ton)',
    cop_parameters_title: 'Parameter COP',
    cop_parameters_subtitle: 'Pemilihan parameter operasi kritis',
    report_settings_title: 'Pengaturan Laporan',
    report_settings_subtitle: 'Pengurutan parameter laporan dan konfigurasi',
    report_settings_description: 'Konfigurasi pengurutan parameter laporan dan pengaturan tampilan',
    simple_report_settings_title: 'Pengaturan Laporan Sederhana',
    simple_report_settings_subtitle: 'Konfigurasi parameter untuk laporan operasional sederhana',
    add_simple_report_parameter_title: 'Tambah Parameter Laporan Sederhana',
    edit_simple_report_parameter_title: 'Ubah Parameter Laporan Sederhana',
    parameter_select_label: 'Parameter',
    report_category_label: 'Kategori',
    unit: 'Unit Pabrik',
    parameter_id: 'ID Parameter',
    parameter: 'Parameter',
    data_type: 'Tipe Data',
    min_value: 'Nilai Min',
    max_value: 'Nilai Maks',
    opc_min: 'OPC Min',
    opc_max: 'OPC Maks',
    pcc_min: 'PCC Min',
    pcc_max: 'PCC Maks',
    silo_lifestock: 'Stok Hidup Silo',
    order: 'Urutan',
    plant_category: 'Kategori Pabrik',
    category: 'Kategori',
    silo_name: 'Nama Silo',
    capacity: 'Kapasitas',
    dead_stock: 'Stok Mati',

    // WhatsApp Group Report Translations
    wag_daily_report_title: '📊 *LAPORAN HARIAN PRODUKSI* 📊',
    wag_shift1_report_title: '🌅 *LAPORAN SHIFT 1 PRODUKSI* 🌅',
    wag_shift2_report_title: '🌆 *LAPORAN SHIFT 2 PRODUKSI* 🌆',
    wag_shift3_report_title: '🌙 *LAPORAN SHIFT 3 PRODUKSI* 🌙',
    wag_plant_category: '🏭 *${category}*',
    wag_date: '📅 ${date}',
    wag_separator: '━━━━━━━━━━━━━━━━━━━━━',
    wag_daily_summary: '📈 *RINGKASAN HARIAN*',
    wag_shift1_summary: '� *SHIFT 1 SUMMARY*',
    wag_shift2_summary: '📊 *SHIFT 2 SUMMARY*',
    wag_shift3_summary: '📊 *SHIFT 3 SUMMARY*',
    wag_total_active_units: '├─ Total Unit Aktif: ${count}',
    wag_total_production: '├─ Total Produksi: ${value} ton',
    wag_average_feed: '├─ Rata-rata Feed: ${value} tph',
    wag_total_operating_hours: '├─ Total Jam Operasi: ${value} jam',
    wag_total_downtime: '└─ Total Downtime: ${value} jam',
    wag_unit_mill: '🏭 *UNIT MILL ${unit}*',
    wag_daily_production: '📈 *PRODUKSI HARIAN* ${status}',
    wag_shift_production: '📈 *PRODUKSI SHIFT* ${status}',
    wag_product_type: '├─ Tipe Produk: ${type}',
    wag_feed_rate: '├─ Feed Rate: ${value} tph',
    wag_operating_hours: '├─ Jam Operasi: ${value} jam',
    wag_total_production_unit: '└─ Total Produksi: ${value} ton',
    wag_quality: '*KUALITAS*',
    wag_material_usage: '*PEMAKAIAN BAHAN*',
    wag_feeder_settings: '*SETTING FEEDER*',
    wag_additional_notes: '⚠️ *CATATAN TAMBAHAN*',
    wag_silo_status: '🏪 *STATUS SILO SEMEN*',
    wag_silo_empty: 'Kosong',
    wag_silo_content: 'Isi',
    wag_silo_fill: 'Terisi',
    wag_closing_statement: '✅ *Demikian laporan harian ini. Terima kasih.*',
    wag_shift_closing_statement: '✅ *Demikian laporan shift ini. Terima kasih.*',
    wag_system_signature: '🔧 *SIPOMA - Production Monitoring System*',
    wag_shift1_title: 'SHIFT 1 (07:00 - 15:00)',
    wag_shift2_title: 'SHIFT 2 (15:00 - 23:00)',
    wag_shift3_title: 'SHIFT 3 (23:00 - 07:00)',
    wag_error_generating_report:
      '*Laporan Harian Produksi*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*',

    // Plant Operations CCR Data Entry
    ccr_data_entry_title: 'Entri Data Silo CCR',
    ccr_parameter_data_entry_title: 'Entri Data Parameter CCR',
    ccr_search_columns: 'Cari Kolom',
    ccr_search_placeholder: 'Cari berdasarkan nama parameter atau unit...',
    ccr_search_results: 'kolom ditemukan',
    ccr_search_results_plural: 'kolom ditemukan',
    ccr_clear_search: 'Hapus pencarian',
    ccr_no_columns_match: 'Tidak ada kolom yang sesuai dengan pencarian',
    operator_name: 'Nama Operator',
    hour: 'Jam',
    shift: 'Shift',
    shift_3_cont: 'Lanjutan',
    select_date: 'Pilih Tanggal',
    shift_1: 'Shift 1',
    shift_2: 'Shift 2',
    shift_3: 'Shift 3',
    empty_space: 'Ruang Kosong (m)',
    content: 'Isi (Ton)',
    percentage: 'Persentase (%)',
    parameter_data: 'Data Parameter',
    material_usage: 'Penggunaan Material',
    downtime_data_entry_title: 'Entri Data Downtime',
    information: 'Informasi',
    information_label: 'Informasi tambahan dalam operasional',
    information_placeholder: 'Masukkan informasi apa saja dalam pengoperasian',
    start_time: 'Waktu Mulai',
    end_time: 'Waktu Selesai',
    pic: 'PIC',
    problem: 'Masalah',
    add_downtime_button: 'Tambah Downtime',
    edit_downtime_title: 'Ubah Downtime',
    add_downtime_title: 'Tambah Downtime',
    no_downtime_recorded: 'Tidak ada downtime yang tercatat untuk tanggal ini.',
    total: 'Total',
    average: 'Rata-Rata',
    min: 'Min',
    max: 'Maks',
    total_shift_1: 'Total Shift 1',
    total_shift_2: 'Total Shift 2',
    total_shift_3: 'Total Shift 3',
    total_shift_3_cont: 'Total Shift 3 (Lanjutan)',
    counter_shift_1: 'Counter Shift 1',
    counter_shift_2: 'Counter Shift 2',
    counter_shift_3: 'Counter Shift 3',
    counter_shift_3_cont: 'Counter Shift 3 (Lanjutan)',

    // Autonomous Data Entry
    autonomous_downtime_follow_up: 'Tindak Lanjut Downtime',
    autonomous_risk_management: 'Manajemen Risiko',
    duration: 'Durasi',
    action: 'Tindakan',
    corrective_action: 'Korektif',
    edit_downtime_follow_up_title: 'Ubah Tindak Lanjut Downtime',
    no_downtime_for_month: 'Tidak ada insiden downtime yang tercatat untuk bulan yang dipilih.',
    potential_disruption: 'Potensi Gangguan',
    preventive_action: 'Tindakan Pencegahan',
    risk_mitigation_plan: 'Rencana Mitigasi Risiko',
    add_risk_button: 'Tambah Risiko',
    edit_risk_title: 'Ubah Risiko',
    add_risk_title: 'Tambah Risiko Baru',

    // Project Management
    proj_dashboard: 'Dasbor',
    proj_list: 'Daftar Proyek',
    add_project: 'Tambah Proyek',
    edit_project: 'Edit Proyek',
    project_name: 'Nama Proyek',
    project_name_placeholder: 'Masukkan nama proyek...',
    confirm_delete: 'Konfirmasi Hapus',
    confirm_delete_project_message:
      'Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua tugas terkait.',
    add: 'Tambah',
    update: 'Perbarui',
    edit: 'Edit',
    delete: 'Hapus',
    cancel: 'Batal',
    save: 'Simpan',
    select_project: 'Pilih Proyek',
    project_overview_title: 'Ringkasan Proyek',
    project_tasks: 'Tugas Proyek',
    proj_duration: 'Durasi Proyek',
    proj_total_tasks: 'Total Tugas',
    proj_budget: 'Anggaran',
    s_curve_chart_title: 'Grafik Kurva S',
    gantt_chart_view: 'Bagan Gantt',
    performance_summary_title: 'Ringkasan Kinerja',
    overall_progress: 'Progres Keseluruhan',
    project_status: 'Status Proyek',
    current_deviation: 'Deviasi Saat Ini',
    predicted_completion: 'Prediksi Selesai',
    task_details_title: 'Detail Tugas',
    add_task_button: 'Tambah Tugas',
    edit_task_title: 'Ubah Tugas',
    add_task_title: 'Tambah Tugas Baru',
    clear_filter_button: 'Hapus Filter',
    active_tasks_header: 'Tugas Aktif:',
    // Project Dashboard
    project_dashboard_title: 'Gambaran Umum Proyek',
    total_projects: 'Total Proyek',
    overall_progress_all: 'Progres Keseluruhan',
    projects_on_track: 'Sesuai Jadwal',
    projects_delayed: 'Terlambat',
    projects_completed_count: 'Selesai',
    projects_by_status: 'Proyek Berdasarkan Status',
    project_summary: 'Ringkasan Proyek',
    view_details_button: 'Lihat Detail',
    upcoming_deadlines: 'Tenggat Waktu Mendatang (7 Hari ke Depan)',
    no_upcoming_deadlines: 'Tidak ada tugas yang akan jatuh tempo dalam 7 hari ke depan.',

    // Enhanced Dashboard Features
    financial_overview: 'Gambaran Keuangan',
    total_budget: 'Total Anggaran',
    budget_utilization: 'Utilisasi Anggaran',
    avg_project_budget: 'Rata-rata Anggaran Proyek',
    high_budget_projects: 'Proyek Anggaran Tinggi',
    progress_trends: 'Tren Progres',
    monthly_progress: 'Progres Bulanan',
    project_velocity: 'Kecepatan Proyek',
    completion_rate: 'Tingkat Penyelesaian',
    resource_allocation: 'Alokasi Sumber Daya',
    active_tasks: 'Tugas Aktif',
    overdue_tasks: 'Tugas Terlambat',
    tasks_due_today: 'Jatuh Tempo Hari Ini',
    tasks_due_this_week: 'Jatuh Tempo Minggu Ini',
    performance_analytics: 'Analitik Kinerja',
    efficiency_score: 'Skor Efisiensi',
    on_time_delivery: 'Pengiriman Tepat Waktu',
    risk_assessment: 'Penilaian Risiko',
    high_risk_projects: 'Proyek Risiko Tinggi',
    medium_risk_projects: 'Proyek Risiko Sedang',
    low_risk_projects: 'Proyek Risiko Rendah',
    critical_issues: 'Isu Kritis',
    projects_requiring_attention: 'Proyek Memerlukan Perhatian',
    executive_insights: 'Wawasan Eksekutif',
    recommendations: 'Rekomendasi Utama',
    project_health_score: 'Skor Kesehatan Proyek',
    team_productivity: 'Produktivitas Tim',
    milestone_tracking: 'Pelacakan Milestone',
    upcoming_milestones: 'Milestone Mendatang',
    missed_milestones: 'Milestone Terlewat',
    budget_variance: 'Variansi Anggaran',
    schedule_variance: 'Variansi Jadwal',
    quality_metrics: 'Metrik Kualitas',
    last_30_days: '30 Hari Terakhir',
    this_quarter: 'Kuartal Ini',
    project_distribution: 'Distribusi Proyek',
    workload_distribution: 'Distribusi Beban Kerja',
    // Task Table Headers
    task_no: 'No.',
    task_activity: 'Aktivitas',
    task_status: 'Status',
    task_weight: 'Bobot (%)',
    task_planned_start: 'Rencana Mulai',
    task_planned_end: 'Rencana Selesai',
    task_duration: 'Durasi (Hari)',
    task_actual_start: 'Aktual Mulai',
    task_actual_end: 'Aktual Selesai',
    task_percent_complete: '% Selesai',
    // Task Form
    activity_label: 'Aktivitas',
    planned_start_label: 'Tanggal Rencana Mulai',
    planned_end_label: 'Tanggal Rencana Selesai',
    actual_start_label: 'Tanggal Aktual Mulai',
    actual_end_label: 'Tanggal Aktual Selesai',
    percent_complete_label: 'Persen Selesai (%)',
    // Task Statuses
    status_not_started: 'Belum Mulai',
    status_in_progress: 'Sedang Berjalan',
    status_completed: 'Selesai',
    // Project Statuses
    proj_status_on_track: 'Sesuai Jadwal',
    proj_status_ahead: 'Lebih Cepat',
    proj_status_delayed: 'Terlambat',
    proj_status_completed: 'Selesai',
    // S-Curve Legend
    legend_planned_progress: 'Progres Rencana',
    legend_actual_progress: 'Progres Aktual',

    // Placeholder
    under_construction: 'Modul ini sedang dalam pengembangan.',

    // Access Control
    access_denied: 'Akses Ditolak',
    back_to_dashboard: 'Kembali ke Dashboard',

    // COP Analysis
    qaf_daily: 'QAF Harian',
    qaf_tooltip: '{inRange} dari {total} parameter dalam rentang',

    // Footer
    footer_copyright: 'SIPOMA. Semua Hak Cipta Dilindungi.',
    footer_terms: 'Ketentuan Layanan',
    footer_privacy: 'Kebijakan Privasi',
    footer_contact: 'Hubungi Kami',

    // Error Boundary
    error_title: 'Terjadi Kesalahan',
    error_message: 'Maaf, terjadi kesalahan saat memuat komponen ini.',
    error_retry: 'Coba Lagi',

    // Login
    login_username_required: 'Nama pengguna diperlukan',
    login_password_required: 'Kata sandi diperlukan',
    login_username_label: 'Nama Pengguna',
    login_password_label: 'Kata Sandi',
    login_logging_in: 'Sedang masuk...',
    login_guest_button: 'Masuk sebagai Tamu',
    login_guest_error: 'Login tamu gagal. Silakan coba login biasa.',
    login_subtitle: 'Aplikasi Manajemen Operasi Pabrik Terintegrasi Cerdas',
    login_no_account: 'Belum punya akun?',
    login_register_here: 'Daftar di sini',
    login_copyright: 'Semua hak dilindungi undang-undang.',

    // Registration
    registration_name_required: 'Nama lengkap wajib diisi',
    registration_email_required: 'Email wajib diisi',
    registration_email_invalid: 'Format email tidak valid',
    registration_success: 'Permintaan Registrasi Berhasil!',

    // CCR Data Entry specific keys
    ccr_material_usage_entry_title: 'Entri Penggunaan Material CCR',
    loading_data: 'Memuat data...',
    select_category_unit_date_first: 'Silakan pilih kategori, unit, dan tanggal terlebih dahulu',
    select_unit_first: 'Silakan pilih Unit Name terlebih dahulu sebelum menambah downtime.',
    failed_to_fetch_profiles: 'Gagal mengambil profil',
    profile_saved_successfully: 'Profil berhasil disimpan',
    failed_to_save_profile: 'Gagal menyimpan profil',
    parameter_order_exported_successfully: 'Urutan parameter berhasil diekspor',
    failed_to_export_parameter_order: 'Gagal mengekspor urutan parameter',
    invalid_excel_file_format: 'Format file Excel tidak valid',
    warning_some_parameters_not_imported: 'Peringatan: Beberapa parameter tidak dapat diimpor',
    parameter_order_imported_successfully: 'Urutan parameter berhasil diimpor',
    failed_to_process_excel_file: 'Gagal memproses file Excel',
    failed_to_import_parameter_order: 'Gagal mengimpor urutan parameter',
    profile_loaded: 'Profil "{name}" dimuat',
    failed_to_load_profile: 'Gagal memuat profil',
    invalid_profile_selected: 'Profil yang dipilih tidak valid',
    you_can_only_delete_own_profiles: 'Anda hanya dapat menghapus profil sendiri',
    profile_deleted_successfully: 'Profil "{name}" berhasil dihapus',
    failed_to_delete_profile: 'Gagal menghapus profil',
    network_error_delete_profile: 'Gagal menghapus profil: Kesalahan jaringan atau server',
    error_fetching_parameter_data: 'Kesalahan mengambil data parameter',
    no_parameter_data_found:
      'Tidak ada data parameter ditemukan untuk tanggal dan unit yang dipilih.',
    no_plant_categories_found: 'Tidak ada kategori pabrik ditemukan di Master Data.',
    no_silo_master_data_found: 'Tidak ada data master silo ditemukan untuk kategori: {category}.',
    no_parameter_master_data_found: 'Tidak ada data master parameter ditemukan untuk unit: {unit}.',
    parameter_not_found:
      'Parameter "{name}" tidak ditemukan di pengaturan parameter untuk unit {unit}',
    choose_category: 'Pilih Kategori',
    choose_unit: 'Pilih Unit',

    // CCR Data Entry Modal Titles
    parameter_position_title: 'Masukkan nomor posisi parameter',
    search_columns_tooltip:
      'Cari kolom berdasarkan nama parameter atau unit. Gunakan Ctrl+F untuk fokus, Escape untuk menghapus.',
    confirm_delete_downtime_title: 'Konfirmasi Hapus Downtime',
    reorder_parameters_title: 'Susun Ulang Parameter',
    save_parameter_order_profile_title: 'Simpan Profil Urutan Parameter',
    load_parameter_order_profile_title: 'Muat Profil Urutan Parameter',
    delete_parameter_order_profile_title: 'Hapus Profil Urutan Parameter',

    // CCR Data Entry Section Descriptions
    ccr_silo_data_description: 'Data silo CCR untuk monitoring kapasitas',
    ccr_material_usage_description: 'Data penggunaan material CCR untuk monitoring konsumsi',
    ccr_information_description: 'Catat informasi penting terkait operasi CCR hari ini.',
    ccr_downtime_description: 'Catat waktu downtime dan alasan untuk analisis efisiensi produksi.',

    // CCR Data Entry Page Descriptions
    ccr_page_description: 'Kelola data CCR untuk monitoring performa pabrik',
    ccr_parameter_section_description:
      'Pastikan Plant Kategori dan Plant Unit sesuai dengan filter yang diterapkan sebelum mengisi data parameter.',
  },
};
