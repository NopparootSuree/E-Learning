BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[answers] DROP CONSTRAINT [answers_points_df];
ALTER TABLE [dbo].[answers] ADD CONSTRAINT [answers_POINTS_df] DEFAULT 0 FOR [POINTS];

-- AlterTable
ALTER TABLE [dbo].[course_attempts] DROP CONSTRAINT [course_attempts_contentProgress_df],
[course_attempts_status_df];
ALTER TABLE [dbo].[course_attempts] ADD CONSTRAINT [course_attempts_CONTENT_PROGRESS_df] DEFAULT 0 FOR [CONTENT_PROGRESS], CONSTRAINT [course_attempts_STATUS_df] DEFAULT 'in_progress' FOR [STATUS];

-- AlterTable
ALTER TABLE [dbo].[courses] DROP CONSTRAINT [courses_contentSource_df],
[courses_isActive_df];
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_CONTENT_SOURCE_df] DEFAULT 'url' FOR [CONTENT_SOURCE], CONSTRAINT [courses_IS_ACTIVE_df] DEFAULT 1 FOR [IS_ACTIVE];

-- AlterTable
ALTER TABLE [dbo].[questions] DROP CONSTRAINT [questions_points_df];
ALTER TABLE [dbo].[questions] ADD CONSTRAINT [questions_POINTS_df] DEFAULT 1 FOR [POINTS];

-- AlterTable
ALTER TABLE [dbo].[test_attempts] DROP CONSTRAINT [test_attempts_status_df];
ALTER TABLE [dbo].[test_attempts] ADD CONSTRAINT [test_attempts_STATUS_df] DEFAULT 'in_progress' FOR [STATUS];

-- AlterTable
ALTER TABLE [dbo].[tests] DROP CONSTRAINT [tests_isActive_df];
ALTER TABLE [dbo].[tests] ADD CONSTRAINT [tests_IS_ACTIVE_df] DEFAULT 1 FOR [IS_ACTIVE];

-- AlterTable
ALTER TABLE [dbo].[users] DROP CONSTRAINT [users_role_df];
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_ROLE_df] DEFAULT 'user' FOR [ROLE];

-- RenameForeignKey
EXEC sp_rename 'dbo.accounts_userId_fkey', 'accounts_USER_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.answers_questionId_fkey', 'answers_QUESTION_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.answers_testAttemptId_fkey', 'answers_TEST_ATTEMPT_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.course_attempts_courseId_fkey', 'course_attempts_COURSE_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.course_attempts_employeeId_fkey', 'course_attempts_EMPLOYEE_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.questions_testId_fkey', 'questions_TEST_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.scores_courseId_fkey', 'scores_COURSE_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.scores_employeeId_fkey', 'scores_EMPLOYEE_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.sessions_userId_fkey', 'sessions_USER_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.test_attempts_employeeId_fkey', 'test_attempts_EMPLOYEE_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.test_attempts_testId_fkey', 'test_attempts_TEST_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.tests_courseId_fkey', 'tests_COURSE_ID_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.users_employeeId_fkey', 'users_EMPLOYEE_ID_fkey', 'OBJECT';

-- RenameIndex
EXEC SP_RENAME N'dbo.accounts.accounts_provider_providerAccountId_key', N'accounts_PROVIDER_PROVIDER_ACCOUNT_ID_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.answers.answers_testAttemptId_questionId_key', N'answers_TEST_ATTEMPT_ID_QUESTION_ID_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.course_attempts.course_attempts_employeeId_courseId_key', N'course_attempts_EMPLOYEE_ID_COURSE_ID_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.scores.scores_employeeId_courseId_key', N'scores_EMPLOYEE_ID_COURSE_ID_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.sessions.sessions_sessionToken_key', N'sessions_SESSION_TOKEN_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.test_attempts.test_attempts_employeeId_testId_key', N'test_attempts_EMPLOYEE_ID_TEST_ID_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.users.users_email_key', N'users_EMAIL_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.users.users_employeeId_key', N'users_EMPLOYEE_ID_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.verificationtokens.verificationtokens_identifier_token_key', N'verificationtokens_IDENTIFIER_TOKEN_key', N'INDEX';

-- RenameIndex
EXEC SP_RENAME N'dbo.verificationtokens.verificationtokens_token_key', N'verificationtokens_TOKEN_key', N'INDEX';

-- Rename tables to UPPERCASE
EXEC sp_rename 'accounts', 'ACCOUNTS';
EXEC sp_rename 'sessions', 'SESSIONS';
EXEC sp_rename 'users', 'USERS';
EXEC sp_rename 'verificationtokens', 'VERIFICATION_TOKENS';
EXEC sp_rename 'employees', 'EMPLOYEES';
EXEC sp_rename 'courses', 'COURSES';
EXEC sp_rename 'tests', 'TESTS';
EXEC sp_rename 'questions', 'QUESTIONS';
EXEC sp_rename 'course_attempts', 'COURSE_ATTEMPTS';
EXEC sp_rename 'test_attempts', 'TEST_ATTEMPTS';
EXEC sp_rename 'answers', 'ANSWERS';
EXEC sp_rename 'scores', 'SCORES';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
