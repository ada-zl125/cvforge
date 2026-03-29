-- Rename template values: academic/classic → general
update resumes set template = 'general' where template in ('academic', 'classic');

-- Update default for new rows
alter table resumes alter column template set default 'general';
