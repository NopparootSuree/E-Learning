-- Convert all column names to UPPERCASE

-- Users table
EXEC sp_rename 'users.id', 'ID', 'COLUMN';
EXEC sp_rename 'users.name', 'NAME', 'COLUMN';
EXEC sp_rename 'users.email', 'EMAIL', 'COLUMN';
EXEC sp_rename 'users.emailVerified', 'EMAIL_VERIFIED', 'COLUMN';
EXEC sp_rename 'users.image', 'IMAGE', 'COLUMN';
EXEC sp_rename 'users.role', 'ROLE', 'COLUMN';
EXEC sp_rename 'users.employeeId', 'EMPLOYEE_ID', 'COLUMN';
EXEC sp_rename 'users.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'users.updatedAt', 'UPDATED_AT', 'COLUMN';

-- Accounts table  
EXEC sp_rename 'accounts.id', 'ID', 'COLUMN';
EXEC sp_rename 'accounts.userId', 'USER_ID', 'COLUMN';
EXEC sp_rename 'accounts.type', 'TYPE', 'COLUMN';
EXEC sp_rename 'accounts.provider', 'PROVIDER', 'COLUMN';
EXEC sp_rename 'accounts.providerAccountId', 'PROVIDER_ACCOUNT_ID', 'COLUMN';
EXEC sp_rename 'accounts.refresh_token', 'REFRESH_TOKEN', 'COLUMN';
EXEC sp_rename 'accounts.access_token', 'ACCESS_TOKEN', 'COLUMN';
EXEC sp_rename 'accounts.expires_at', 'EXPIRES_AT', 'COLUMN';
EXEC sp_rename 'accounts.token_type', 'TOKEN_TYPE', 'COLUMN';
EXEC sp_rename 'accounts.scope', 'SCOPE', 'COLUMN';
EXEC sp_rename 'accounts.id_token', 'ID_TOKEN', 'COLUMN';
EXEC sp_rename 'accounts.session_state', 'SESSION_STATE', 'COLUMN';

-- Sessions table
EXEC sp_rename 'sessions.id', 'ID', 'COLUMN';
EXEC sp_rename 'sessions.sessionToken', 'SESSION_TOKEN', 'COLUMN';
EXEC sp_rename 'sessions.userId', 'USER_ID', 'COLUMN';
EXEC sp_rename 'sessions.expires', 'EXPIRES', 'COLUMN';

-- VerificationTokens table
EXEC sp_rename 'verificationtokens.identifier', 'IDENTIFIER', 'COLUMN';
EXEC sp_rename 'verificationtokens.token', 'TOKEN', 'COLUMN';
EXEC sp_rename 'verificationtokens.expires', 'EXPIRES', 'COLUMN';

-- Employees table (already has some uppercase columns)
EXEC sp_rename 'employees.id', 'ID', 'COLUMN';
EXEC sp_rename 'employees.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'employees.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'employees.deletedAt', 'DELETED_AT', 'COLUMN';

-- Courses table
EXEC sp_rename 'courses.id', 'ID', 'COLUMN';
EXEC sp_rename 'courses.title', 'TITLE', 'COLUMN';
EXEC sp_rename 'courses.description', 'DESCRIPTION', 'COLUMN';
EXEC sp_rename 'courses.contentType', 'CONTENT_TYPE', 'COLUMN';
EXEC sp_rename 'courses.contentUrl', 'CONTENT_URL', 'COLUMN';
EXEC sp_rename 'courses.contentSource', 'CONTENT_SOURCE', 'COLUMN';
EXEC sp_rename 'courses.contentFile', 'CONTENT_FILE', 'COLUMN';
EXEC sp_rename 'courses.isActive', 'IS_ACTIVE', 'COLUMN';
EXEC sp_rename 'courses.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'courses.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'courses.deletedAt', 'DELETED_AT', 'COLUMN';

-- Tests table
EXEC sp_rename 'tests.id', 'ID', 'COLUMN';
EXEC sp_rename 'tests.courseId', 'COURSE_ID', 'COLUMN';
EXEC sp_rename 'tests.type', 'TYPE', 'COLUMN';
EXEC sp_rename 'tests.title', 'TITLE', 'COLUMN';
EXEC sp_rename 'tests.description', 'DESCRIPTION', 'COLUMN';
EXEC sp_rename 'tests.isActive', 'IS_ACTIVE', 'COLUMN';
EXEC sp_rename 'tests.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'tests.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'tests.deletedAt', 'DELETED_AT', 'COLUMN';

-- Questions table
EXEC sp_rename 'questions.id', 'ID', 'COLUMN';
EXEC sp_rename 'questions.testId', 'TEST_ID', 'COLUMN';
EXEC sp_rename 'questions.type', 'TYPE', 'COLUMN';
EXEC sp_rename 'questions.question', 'QUESTION', 'COLUMN';
EXEC sp_rename 'questions.options', 'OPTIONS', 'COLUMN';
EXEC sp_rename 'questions.correctAnswer', 'CORRECT_ANSWER', 'COLUMN';
EXEC sp_rename 'questions.points', 'POINTS', 'COLUMN';
EXEC sp_rename 'questions.order', 'ORDER', 'COLUMN';
EXEC sp_rename 'questions.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'questions.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'questions.deletedAt', 'DELETED_AT', 'COLUMN';

-- Course attempts table
EXEC sp_rename 'course_attempts.id', 'ID', 'COLUMN';
EXEC sp_rename 'course_attempts.employeeId', 'EMPLOYEE_ID', 'COLUMN';
EXEC sp_rename 'course_attempts.courseId', 'COURSE_ID', 'COLUMN';
EXEC sp_rename 'course_attempts.startedAt', 'STARTED_AT', 'COLUMN';
EXEC sp_rename 'course_attempts.completedAt', 'COMPLETED_AT', 'COLUMN';
EXEC sp_rename 'course_attempts.status', 'STATUS', 'COLUMN';
EXEC sp_rename 'course_attempts.contentStartedAt', 'CONTENT_STARTED_AT', 'COLUMN';
EXEC sp_rename 'course_attempts.contentCompletedAt', 'CONTENT_COMPLETED_AT', 'COLUMN';
EXEC sp_rename 'course_attempts.contentDuration', 'CONTENT_DURATION', 'COLUMN';
EXEC sp_rename 'course_attempts.contentProgress', 'CONTENT_PROGRESS', 'COLUMN';
EXEC sp_rename 'course_attempts.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'course_attempts.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'course_attempts.deletedAt', 'DELETED_AT', 'COLUMN';

-- Test attempts table
EXEC sp_rename 'test_attempts.id', 'ID', 'COLUMN';
EXEC sp_rename 'test_attempts.employeeId', 'EMPLOYEE_ID', 'COLUMN';
EXEC sp_rename 'test_attempts.testId', 'TEST_ID', 'COLUMN';
EXEC sp_rename 'test_attempts.startedAt', 'STARTED_AT', 'COLUMN';
EXEC sp_rename 'test_attempts.completedAt', 'COMPLETED_AT', 'COLUMN';
EXEC sp_rename 'test_attempts.score', 'SCORE', 'COLUMN';
EXEC sp_rename 'test_attempts.status', 'STATUS', 'COLUMN';
EXEC sp_rename 'test_attempts.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'test_attempts.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'test_attempts.deletedAt', 'DELETED_AT', 'COLUMN';

-- Answers table
EXEC sp_rename 'answers.id', 'ID', 'COLUMN';
EXEC sp_rename 'answers.testAttemptId', 'TEST_ATTEMPT_ID', 'COLUMN';
EXEC sp_rename 'answers.questionId', 'QUESTION_ID', 'COLUMN';
EXEC sp_rename 'answers.answer', 'ANSWER', 'COLUMN';
EXEC sp_rename 'answers.isCorrect', 'IS_CORRECT', 'COLUMN';
EXEC sp_rename 'answers.points', 'POINTS', 'COLUMN';
EXEC sp_rename 'answers.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'answers.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'answers.deletedAt', 'DELETED_AT', 'COLUMN';

-- Scores table
EXEC sp_rename 'scores.id', 'ID', 'COLUMN';
EXEC sp_rename 'scores.employeeId', 'EMPLOYEE_ID', 'COLUMN';
EXEC sp_rename 'scores.courseId', 'COURSE_ID', 'COLUMN';
EXEC sp_rename 'scores.preTestScore', 'PRE_TEST_SCORE', 'COLUMN';
EXEC sp_rename 'scores.postTestScore', 'POST_TEST_SCORE', 'COLUMN';
EXEC sp_rename 'scores.finalScore', 'FINAL_SCORE', 'COLUMN';
EXEC sp_rename 'scores.completedAt', 'COMPLETED_AT', 'COLUMN';
EXEC sp_rename 'scores.createdAt', 'CREATED_AT', 'COLUMN';
EXEC sp_rename 'scores.updatedAt', 'UPDATED_AT', 'COLUMN';
EXEC sp_rename 'scores.deletedAt', 'DELETED_AT', 'COLUMN';