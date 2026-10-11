const fs = require('fs');

const raw = `go home,NAVIGATE,,,/,NAVIGATE,0,Opening home dashboard.
take me home,NAVIGATE,,,/,NAVIGATE,0,Opening home dashboard.
dashboard,NAVIGATE,,,/,NAVIGATE,0,Opening home dashboard.
back to dashboard,NAVIGATE,,,/,NAVIGATE,0,Opening home dashboard.
main screen,NAVIGATE,,,/,NAVIGATE,0,Opening home dashboard.
head home,NAVIGATE,,,/,NAVIGATE,0,Opening home dashboard.
open routine,NAVIGATE,,,/routine,NAVIGATE,0,Opening your routine.
show my routine,NAVIGATE,,,/routine,NAVIGATE,0,Opening your routine.
today's schedule,NAVIGATE,,,/routine,NAVIGATE,0,Opening your routine.
check daily tasks,NAVIGATE,,,/routine,NAVIGATE,0,Opening your routine.
view routine,NAVIGATE,,,/routine,NAVIGATE,0,Opening your routine.
go to reformers,NAVIGATE,,,/reformers,NAVIGATE,0,Opening Reformers League.
open reformer league,NAVIGATE,,,/reformers,NAVIGATE,0,Opening Reformers League.
show reformers,NAVIGATE,,,/reformers,NAVIGATE,0,Opening Reformers League.
the league,NAVIGATE,,,/reformers,NAVIGATE,0,Opening Reformers League.
community page,NAVIGATE,,,/reformers,NAVIGATE,0,Opening Reformers League.
open rewards,NAVIGATE,,,/rewards,NAVIGATE,0,Opening Achievement Center.
show achievement center,NAVIGATE,,,/rewards,NAVIGATE,0,Opening Achievement Center.
view my coins,NAVIGATE,,,/rewards,NAVIGATE,0,Opening Achievement Center.
check wallet,NAVIGATE,,,/rewards,NAVIGATE,0,Opening Achievement Center.
open achievements,NAVIGATE,,,/rewards,NAVIGATE,0,Opening Achievement Center.
open log book,NAVIGATE,,,/analytics,NAVIGATE,0,Opening Task Log Book.
show task log,NAVIGATE,,,/analytics,NAVIGATE,0,Opening Task Log Book.
task analytics,NAVIGATE,,,/analytics,NAVIGATE,0,Opening Task Log Book.
view history,NAVIGATE,,,/analytics,NAVIGATE,0,Opening Task Log Book.
productivity records,NAVIGATE,,,/analytics,NAVIGATE,0,Opening Task Log Book.
open presets,NAVIGATE,,,/presets,NAVIGATE,0,Opening preset catalog.
view routine templates,NAVIGATE,,,/presets,NAVIGATE,0,Opening preset catalog.
task presets,NAVIGATE,,,/presets,NAVIGATE,0,Opening preset catalog.
show preset catalog,NAVIGATE,,,/presets,NAVIGATE,0,Opening preset catalog.
open settings,NAVIGATE,,,/settings,NAVIGATE,0,Opening settings.
preferences,NAVIGATE,,,/settings,NAVIGATE,0,Opening settings.
system settings,NAVIGATE,,,/settings,NAVIGATE,0,Opening settings.
app configuration,NAVIGATE,,,/settings,NAVIGATE,0,Opening settings.
show privacy policy,NAVIGATE,,,/privacy,NAVIGATE,0,Opening privacy policy.
open privacy,NAVIGATE,,,/privacy,NAVIGATE,0,Opening privacy policy.
go to active timer,NAVIGATE,,,/timer,NAVIGATE,0,Opening active timer.
open timer screen,NAVIGATE,,,/timer,NAVIGATE,0,Opening active timer.
view current clock,NAVIGATE,,,/timer,NAVIGATE,0,Opening active timer.
fullscreen timer,NAVIGATE,,,/timer,NAVIGATE,0,Opening active timer.
go back,NAVIGATE,,,WINDOW_BACK,NAVIGATE,0,Going back.
previous screen,NAVIGATE,,,WINDOW_BACK,NAVIGATE,0,Going back.
start timer,TIMER_START,,,,START,0,Timer started.
begin task,TIMER_START,,,,START,0,Timer started.
start the clock,TIMER_START,,,,START,0,Timer started.
let's go,TIMER_START,,,,START,0,Timer started.
run timer,TIMER_START,,,,START,0,Timer started.
start focus,TIMER_START,,,,START,0,Timer started.
pause timer,TIMER_PAUSE,,,,PAUSE,0,Timer paused.
pause the clock,TIMER_PAUSE,,,,PAUSE,0,Timer paused.
hold on,TIMER_PAUSE,,,,PAUSE,0,Timer paused.
wait a second,TIMER_PAUSE,,,,PAUSE,0,Timer paused.
take a pause,TIMER_PAUSE,,,,PAUSE,0,Timer paused.
freeze clock,TIMER_PAUSE,,,,PAUSE,0,Timer paused.
resume timer,TIMER_RESUME,,,,RESUME,0,Resuming timer.
unpause,TIMER_RESUME,,,,RESUME,0,Resuming timer.
keep going,TIMER_RESUME,,,,RESUME,0,Resuming timer.
continue session,TIMER_RESUME,,,,RESUME,0,Resuming timer.
back to work,TIMER_RESUME,,,,RESUME,0,Resuming timer.
stop timer,TIMER_STOP,,,,COMPLETE,0,Task complete. Great work!
end task,TIMER_STOP,,,,COMPLETE,0,Task complete. Great work!
finish task,TIMER_STOP,,,,COMPLETE,0,Task complete. Great work!
mark complete,TIMER_STOP,,,,COMPLETE,0,Task complete. Great work!
wrap it up,TIMER_STOP,,,,COMPLETE,0,Task complete. Great work!
task done,TIMER_STOP,,,,COMPLETE,0,Task complete. Great work!
cancel timer,TIMER_STOP,,,,ABORT,0,Timer reset.
abort task,TIMER_STOP,,,,ABORT,0,Timer reset.
reset timer,TIMER_STOP,,,,ABORT,0,Timer reset.
discard clock,TIMER_STOP,,,,ABORT,0,Timer reset.
stop without saving,TIMER_STOP,,,,ABORT,0,Timer reset.
restart timer,TIMER_RESTART,,,,RESTART,0,Restarting current timer.
start task over,TIMER_RESTART,,,,RESTART,0,Restarting current timer.
add 1 minute,TIMER_EXTEND,,,1,EXTEND,0,Added 1 minute.
add 5 minutes,TIMER_EXTEND,,,5,EXTEND,0,Added 5 minutes.
give me 5 more minutes,TIMER_EXTEND,,,5,EXTEND,0,Added 5 minutes.
extend by 5,TIMER_EXTEND,,,5,EXTEND,0,Added 5 minutes.
add 10 minutes,TIMER_EXTEND,,,10,EXTEND,0,Added 10 minutes.
give me 10 more minutes,TIMER_EXTEND,,,10,EXTEND,0,Added 10 minutes.
extend timer by 10,TIMER_EXTEND,,,10,EXTEND,0,Added 10 minutes.
add 15 minutes,TIMER_EXTEND,,,15,EXTEND,0,Added 15 minutes.
subtract 5 minutes,TIMER_REDUCE,,,5,REDUCE,0,Reduced by 5 minutes.
set interval 5 minutes,TIMER_SET_INTERVAL,,,5,SET_INTERVAL,0,Interval set: 5 minutes.
remind me every 5 minutes,TIMER_SET_INTERVAL,,,5,SET_INTERVAL,0,Interval set: 5 minutes.
set interval 10 minutes,TIMER_SET_INTERVAL,,,10,SET_INTERVAL,0,Interval set: 10 minutes.
remind me every 10 minutes,TIMER_SET_INTERVAL,,,10,SET_INTERVAL,0,Interval set: 10 minutes.
set interval 15 minutes,TIMER_SET_INTERVAL,,,15,SET_INTERVAL,0,Interval set: 15 minutes.
turn off interval alerts,TIMER_SET_INTERVAL,,,0,SET_INTERVAL,0,Interval reminders disabled.
skip to next task,TIMER_SKIP,,,,SKIP,0,Skipping to next task.
next task in routine,TIMER_SKIP,,,,SKIP,0,Skipping to next task.
start meditation,TASK_CREATE,Meditation,10,,,30,Starting 10-minute meditation.
meditate 10 minutes,TASK_CREATE,Meditation,10,,,30,Starting 10-minute meditation.
begin mindfulness,TASK_CREATE,Meditation,10,,,30,Starting 10-minute meditation.
10 minute meditation,TASK_CREATE,Meditation,10,,,30,Starting 10-minute meditation.
start 5 minute meditation,TASK_CREATE,Meditation,5,,,30,Starting 5-minute meditation.
quick mental reset,TASK_CREATE,Meditation,5,,,30,Starting 5-minute meditation.
start deep breathing,TASK_CREATE,Meditation,4,,,30,Starting 4-minute oxygenation.
oxygenation session,TASK_CREATE,Meditation,4,,,30,Starting 4-minute oxygenation.
box breathing 4 minutes,TASK_CREATE,Meditation,4,,,30,Starting 4-minute oxygenation.
pranayama flow,TASK_CREATE,Meditation,4,,,30,Starting 4-minute oxygenation.
start 2 minute breathing,TASK_CREATE,Meditation,2,,,30,Starting 2-minute breathing.
start visualization,TASK_CREATE,Productivity,10,,,30,Starting visualization session.
10 minute vision review,TASK_CREATE,Productivity,10,,,30,Starting visualization session.
mental rehearsal,TASK_CREATE,Productivity,10,,,30,Starting visualization session.
visualize goals,TASK_CREATE,Productivity,10,,,30,Starting visualization session.
start workout,TASK_CREATE,Fitness,20,,,40,Starting 20-minute workout.
exercise for 20 minutes,TASK_CREATE,Fitness,20,,,40,Starting 20-minute workout.
morning workout,TASK_CREATE,Fitness,20,,,40,Starting 20-minute workout.
start 30 minute workout,TASK_CREATE,Fitness,30,,,40,Starting 30-minute workout.
start 10 minute stretch,TASK_CREATE,Fitness,10,,,40,Starting 10-minute stretch.
mobility routine,TASK_CREATE,Fitness,10,,,40,Starting 10-minute stretch.
start reading,TASK_CREATE,Creativity,15,,,30,Starting 15-minute reading.
read positive 15 minutes,TASK_CREATE,Creativity,15,,,30,Starting 15-minute reading.
wisdom reading,TASK_CREATE,Creativity,15,,,30,Starting 15-minute reading.
start 20 minute reading,TASK_CREATE,Creativity,20,,,30,Starting 20-minute reading.
start scribing,TASK_CREATE,Creativity,10,,,30,Starting scribing session.
journal for 10 minutes,TASK_CREATE,Creativity,10,,,30,Starting scribing session.
evening intention journaling,TASK_CREATE,Creativity,10,,,30,Starting scribing session.
start 5 minute journaling,TASK_CREATE,Creativity,5,,,30,Starting 5-minute scribing.
start deep work,TASK_CREATE,Productivity,45,,,50,Starting deep work sprint.
code for 45 minutes,TASK_CREATE,Productivity,45,,,50,Starting deep work sprint.
focus block 45 minutes,TASK_CREATE,Productivity,45,,,50,Starting deep work sprint.
start 30 minute focus,TASK_CREATE,Productivity,30,,,50,Starting 30-minute focus.
start 60 minute sprint,TASK_CREATE,Productivity,60,,,50,Starting 60-minute sprint.
drink water timer,TASK_CREATE,Hydration,2,,,15,Starting hydration break.
drink a glass of water,TASK_CREATE,Hydration,2,,,15,Starting hydration break.
clean workspace,TASK_CREATE,Hygiene,5,,,15,Starting workspace hygiene.
make my bed,TASK_CREATE,Hygiene,5,,,15,Starting workspace hygiene.
set work table,TASK_CREATE,Hygiene,5,,,15,Starting workspace hygiene.
take eye strain break,TASK_CREATE,Hygiene,2,,,15,Starting eye rest break.
20-20-20 eye rest,TASK_CREATE,Hygiene,2,,,15,Starting eye rest break.
log water,TASK_LOG_QUICK,Hydration,,,LOG_QUICK,15,Logged. Plus 15 coins!
drank a glass of water,TASK_LOG_QUICK,Hydration,,,LOG_QUICK,15,Logged. Plus 15 coins!
finished my water,TASK_LOG_QUICK,Hydration,,,LOG_QUICK,15,Logged. Plus 15 coins!
water logged,TASK_LOG_QUICK,Hydration,,,LOG_QUICK,15,Logged. Plus 15 coins!
bed made,TASK_LOG_QUICK,Hygiene,,,LOG_QUICK,15,Bed logged. Plus 15!
made my bed,TASK_LOG_QUICK,Hygiene,,,LOG_QUICK,15,Bed logged. Plus 15!
desk cleaned,TASK_LOG_QUICK,Hygiene,,,LOG_QUICK,15,Workspace logged. Plus 15!
table organized,TASK_LOG_QUICK,Hygiene,,,LOG_QUICK,15,Workspace logged. Plus 15!
eye exercise done,TASK_LOG_QUICK,Hygiene,,,LOG_QUICK,15,Eye rest logged. Plus 15!
quick stretch done,TASK_LOG_QUICK,Fitness,,,LOG_QUICK,40,Fitness logged. Plus 40!
completed 10 pushups,TASK_LOG_QUICK,Fitness,,,LOG_QUICK,40,Fitness logged. Plus 40!
completed 10 squats,TASK_LOG_QUICK,Fitness,,,LOG_QUICK,40,Fitness logged. Plus 40!
quick meditation done,TASK_LOG_QUICK,Meditation,,,LOG_QUICK,30,Meditation logged. Plus 30!
read 5 pages,TASK_LOG_QUICK,Creativity,,,LOG_QUICK,30,Reading logged. Plus 30!
quick scribing done,TASK_LOG_QUICK,Creativity,,,LOG_QUICK,30,Scribing logged. Plus 30!
switch to morning primer,ROUTINE_CONTROL,,,,WRAPPER_CHANGE,0,Morning Primer active.
enable morning primer,ROUTINE_CONTROL,,,,WRAPPER_CHANGE,0,Morning Primer active.
switch to evening restorer,ROUTINE_CONTROL,,,,WRAPPER_CHANGE,0,Evening Restorer active.
enable evening restorer,ROUTINE_CONTROL,,,,WRAPPER_CHANGE,0,Evening Restorer active.
apply software engineer routine,ROUTINE_CONTROL,,,,TEMPLATE_CHANGE,0,Software Engineer routine applied.
apply entrepreneur routine,ROUTINE_CONTROL,,,,TEMPLATE_CHANGE,0,Entrepreneur routine applied.
apply student routine,ROUTINE_CONTROL,,,,TEMPLATE_CHANGE,0,Student routine applied.
apply designer routine,ROUTINE_CONTROL,,,,TEMPLATE_CHANGE,0,Designer routine applied.
apply healthcare routine,ROUTINE_CONTROL,,,,TEMPLATE_CHANGE,0,Healthcare routine applied.
set today as day off,ROUTINE_CONTROL,,,,REST_MODE_TOGGLE,0,Rest day routine applied.
resume workday routine,ROUTINE_CONTROL,,,,REST_MODE_TOGGLE,0,Workday routine restored.
reorder routine,ROUTINE_CONTROL,,,,AI_REORGANIZE,0,Optimizing routine order.
clear completed tasks,ROUTINE_CONTROL,,,,RESET_DAILY,0,Daily routine reset.
invite co reformer,COOP_ACTION,,,,INVITE_PARTNER,0,Partner invite sent.
start partner session,COOP_ACTION,,,,START_DUET,0,Partner invite sent.
accept co op invite,COOP_ACTION,,,,ACCEPT_INVITE,0,Connected to co-op session.
leave co op session,COOP_ACTION,,,,LEAVE_SESSION,0,Left co-op session.
coach start group sprint,COOP_ACTION,,,,BROADCAST_START,0,Group sprint started.
start class timer,COOP_ACTION,,,,BROADCAST_START,0,Group sprint started.
coach pause group timer,COOP_ACTION,,,,BROADCAST_PAUSE,0,Group timer paused.
coach stop group timer,COOP_ACTION,,,,BROADCAST_STOP,0,Group session finished.
coach set group time 10 minutes,COOP_ACTION,,,10,,BROADCAST_DURATION,0,Group timer set: 10 mins.
coach set group time 20 minutes,COOP_ACTION,,,20,,BROADCAST_DURATION,0,Group timer set: 20 mins.
turn on eye tracking,SENSOR_TOGGLE,,,,TOGGLE_EYE_TRACKING_ON,0,Gaze tracking enabled.
enable gaze control,SENSOR_TOGGLE,,,,TOGGLE_EYE_TRACKING_ON,0,Gaze tracking enabled.
turn off eye tracking,SENSOR_TOGGLE,,,,TOGGLE_EYE_TRACKING_OFF,0,Gaze tracking disabled.
disable gaze control,SENSOR_TOGGLE,,,,TOGGLE_EYE_TRACKING_OFF,0,Gaze tracking disabled.
calibrate eye tracking,SENSOR_TOGGLE,,,,GAZE_CALIBRATE,0,Calibrating gaze sensor.
turn on water sounds,SENSOR_TOGGLE,,,,AUDIO_WATER_ON,0,Water soundscape on.
turn off water sounds,SENSOR_TOGGLE,,,,AUDIO_WATER_OFF,0,Water soundscape off.
turn on breathing chimes,SENSOR_TOGGLE,,,,AUDIO_BREATHE_ON,0,Breathing chimes active.
turn off breathing chimes,SENSOR_TOGGLE,,,,AUDIO_BREATHE_OFF,0,Breathing audio muted.
mute all audio,SENSOR_TOGGLE,,,,MUTE_ALL,0,App audio muted.
unmute audio,SENSOR_TOGGLE,,,,UNMUTE_ALL,0,App audio unmuted.
turn on haptics,SENSOR_TOGGLE,,,,HAPTICS_ON,0,Haptics enabled.
turn off haptics,SENSOR_TOGGLE,,,,HAPTICS_OFF,0,Haptics disabled.
check coin balance,REWARDS_ACTION,,,,CHECK_BALANCE,0,Checking your coin balance.
how many coins do I have,REWARDS_ACTION,,,,CHECK_BALANCE,0,Checking your coin balance.
redeem payout,REWARDS_ACTION,,,,REDEEM_UPI,0,Opening payout window.
withdraw cash,REWARDS_ACTION,,,,REDEEM_UPI,0,Opening payout window.
claim direct payout,REWARDS_ACTION,,,,REDEEM_UPI,0,Opening payout window.
pin certificate to profile,REWARDS_ACTION,,,,PIN_CERTIFICATE,0,Certificate pinned to profile.
unpin certificate,REWARDS_ACTION,,,,UNPIN_CERTIFICATE,0,Certificate unpinned.
show leaderboard,REWARDS_ACTION,,,,SHOW_LEADERBOARD,0,Showing top reformers.
show certificates,REWARDS_ACTION,,,,SHOW_CERTIFICATES,0,Displaying your certificates.
generate AI insights,ANALYTICS_ACTION,,,,GENERATE_INSIGHTS,0,Analyzing your productivity.
analyze my productivity,ANALYTICS_ACTION,,,,GENERATE_INSIGHTS,0,Analyzing your productivity.
evaluate my routine,ANALYTICS_ACTION,,,,EVALUATE_ROUTINE,0,Evaluating routine balance.
check reformer readiness,ANALYTICS_ACTION,,,,EVALUATE_READINESS,0,Evaluating league readiness.
show productivity category,ANALYTICS_ACTION,,,Productivity,,FILTER_CATEGORY,0,Showing productivity logs.
show hydration records,ANALYTICS_ACTION,,,Hydration,,FILTER_CATEGORY,0,Showing hydration records.
show fitness logs,ANALYTICS_ACTION,,,Fitness,,FILTER_CATEGORY,0,Showing fitness logs.
show meditation records,ANALYTICS_ACTION,,,Meditation,,FILTER_CATEGORY,0,Showing meditation logs.
close this,SYSTEM_CONTROL,,,,DISMISS,0,Dismissed.
dismiss popup,SYSTEM_CONTROL,,,,DISMISS,0,Dismissed.
cancel,SYSTEM_CONTROL,,,,DISMISS,0,Dismissed.
switch to female voice,SYSTEM_CONTROL,,,,VOICE_FEMALE,0,Switched to female voice.
switch to male voice,SYSTEM_CONTROL,,,,VOICE_MALE,0,Switched to male voice.
talk faster,SYSTEM_CONTROL,,,,VOICE_SPEED_FAST,0,Speaking faster now.
normal voice speed,SYSTEM_CONTROL,,,,VOICE_SPEED_NORMAL,0,Speech speed reset.
stop talking,SYSTEM_CONTROL,,,,VOICE_ABORT,0,
toggle dark mode,SYSTEM_CONTROL,,,,THEME_TOGGLE,0,Theme updated.
scroll down,SYSTEM_CONTROL,,,,SCROLL_DOWN,0,Scrolling down.
scroll up,SYSTEM_CONTROL,,,,SCROLL_UP,0,Scrolling to top.`;

const lines = raw.trim().split('\n');
const records = [];

for (const line of lines) {
  const parts = line.split(',');
  const utterance = parts[0]?.trim();
  const intent = parts[1]?.trim();
  const category = parts[2]?.trim() || undefined;
  const durMin = parts[3]?.trim();
  const durationMinutes = durMin ? parseFloat(durMin) : undefined;
  const targetRoute = parts[4]?.trim() || undefined;
  const actionType = parts[5]?.trim() || undefined;
  const coinsStr = parts[6]?.trim();
  const coinsAwarded = coinsStr ? parseInt(coinsStr, 10) : undefined;
  const speechFeedback = parts.slice(7).join(',').trim();

  records.push({
    utterance,
    intent,
    category,
    durationMinutes,
    targetRoute,
    actionType,
    coinsAwarded,
    speechFeedback
  });
}

const intents = new Set(records.map(r => r.intent));
const actionTypes = new Set(records.map(r => r.actionType).filter(Boolean));
const routes = new Set(records.map(r => r.targetRoute).filter(Boolean));
const categories = new Set(records.map(r => r.category).filter(Boolean));

console.log('Unique Intents:', Array.from(intents));
console.log('Unique Routes:', Array.from(routes));
console.log('Unique Categories:', Array.from(categories));
console.log('Unique ActionTypes:', Array.from(actionTypes));
console.log('Total records:', records.length);
