BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[employees] (
    [id] NVARCHAR(1000) NOT NULL,
    [ID_EMP] NVARCHAR(1000) NOT NULL,
    [NAME] NVARCHAR(1000) NOT NULL,
    [SECTION] NVARCHAR(1000) NOT NULL,
    [DEPARTMENT] NVARCHAR(1000) NOT NULL,
    [COMPANY] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [employees_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [employees_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [employees_ID_EMP_key] UNIQUE NONCLUSTERED ([ID_EMP])
);

-- CreateTable
CREATE TABLE [dbo].[courses] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [contentType] NVARCHAR(1000) NOT NULL,
    [contentUrl] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [courses_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [courses_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [courses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tests] (
    [id] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [tests_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tests_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [tests_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[questions] (
    [id] NVARCHAR(1000) NOT NULL,
    [testId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [question] NVARCHAR(1000) NOT NULL,
    [options] NVARCHAR(1000),
    [correctAnswer] NVARCHAR(1000),
    [points] INT NOT NULL CONSTRAINT [questions_points_df] DEFAULT 1,
    [order] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [questions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [questions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[course_attempts] (
    [id] NVARCHAR(1000) NOT NULL,
    [employeeId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [course_attempts_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [completedAt] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [course_attempts_status_df] DEFAULT 'in_progress',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [course_attempts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [course_attempts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [course_attempts_employeeId_courseId_key] UNIQUE NONCLUSTERED ([employeeId],[courseId])
);

-- CreateTable
CREATE TABLE [dbo].[test_attempts] (
    [id] NVARCHAR(1000) NOT NULL,
    [employeeId] NVARCHAR(1000) NOT NULL,
    [testId] NVARCHAR(1000) NOT NULL,
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [test_attempts_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [completedAt] DATETIME2,
    [score] FLOAT(53),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [test_attempts_status_df] DEFAULT 'in_progress',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [test_attempts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [test_attempts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [test_attempts_employeeId_testId_key] UNIQUE NONCLUSTERED ([employeeId],[testId])
);

-- CreateTable
CREATE TABLE [dbo].[answers] (
    [id] NVARCHAR(1000) NOT NULL,
    [testAttemptId] NVARCHAR(1000) NOT NULL,
    [questionId] NVARCHAR(1000) NOT NULL,
    [answer] NVARCHAR(1000) NOT NULL,
    [isCorrect] BIT,
    [points] FLOAT(53) NOT NULL CONSTRAINT [answers_points_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [answers_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [answers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [answers_testAttemptId_questionId_key] UNIQUE NONCLUSTERED ([testAttemptId],[questionId])
);

-- CreateTable
CREATE TABLE [dbo].[scores] (
    [id] NVARCHAR(1000) NOT NULL,
    [employeeId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [preTestScore] FLOAT(53),
    [postTestScore] FLOAT(53),
    [finalScore] FLOAT(53),
    [completedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [scores_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [scores_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [scores_employeeId_courseId_key] UNIQUE NONCLUSTERED ([employeeId],[courseId])
);

-- AddForeignKey
ALTER TABLE [dbo].[tests] ADD CONSTRAINT [tests_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[questions] ADD CONSTRAINT [questions_testId_fkey] FOREIGN KEY ([testId]) REFERENCES [dbo].[tests]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[course_attempts] ADD CONSTRAINT [course_attempts_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[course_attempts] ADD CONSTRAINT [course_attempts_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[test_attempts] ADD CONSTRAINT [test_attempts_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[test_attempts] ADD CONSTRAINT [test_attempts_testId_fkey] FOREIGN KEY ([testId]) REFERENCES [dbo].[tests]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[answers] ADD CONSTRAINT [answers_testAttemptId_fkey] FOREIGN KEY ([testAttemptId]) REFERENCES [dbo].[test_attempts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[answers] ADD CONSTRAINT [answers_questionId_fkey] FOREIGN KEY ([questionId]) REFERENCES [dbo].[questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scores] ADD CONSTRAINT [scores_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[scores] ADD CONSTRAINT [scores_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
