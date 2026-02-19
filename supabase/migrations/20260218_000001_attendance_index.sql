-- Attendance Performance Index
-- Migration: 20260218_000001_attendance_index
-- Author: Chris (Backend Specialist)
-- Description: Add index on attendance.occurrence_id to speed up batch attendance queries
-- Reference: backend-performance-review.md (Issue: Batch attendance queries)
-- Impact: Faster calendar and events pages with many events, reduces N+1 query patterns

-- Index 1: attendance.occurrence_id
-- Purpose: Optimize batch queries that filter by occurrence_id to get all attendance records
-- Query pattern: .in("occurrence_id", occurrenceIds) on attendance table
-- Impact: Faster getAttendanceSummary and getCalendarData functions, reduces queries from N to 1
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_occurrence
ON public.attendance(occurrence_id);

-- Comment explaining the index
COMMENT ON INDEX idx_attendance_occurrence IS 'Index on occurrence_id for fast batch attendance queries (getAttendanceSummary, getCalendarData)';
