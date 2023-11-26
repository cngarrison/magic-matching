-- changes to types must be committed before they can be used in INSERT statements
-- so created separate migration scripts to handle changes to types

ALTER TYPE public.app_permission ADD VALUE 'embeddings.admin' AFTER 'users.delete';
ALTER TYPE public.app_permission ADD VALUE 'embeddings.update' AFTER 'embeddings.admin';
ALTER TYPE public.app_permission ADD VALUE 'embeddings.delete' AFTER 'embeddings.update';
ALTER TYPE public.app_permission ADD VALUE 'embeddings.read' AFTER 'embeddings.delete';

ALTER TYPE public.app_permission ADD VALUE 'persons.admin' AFTER 'embeddings.read';
ALTER TYPE public.app_permission ADD VALUE 'persons.update' AFTER 'persons.admin';
ALTER TYPE public.app_permission ADD VALUE 'persons.delete' AFTER 'persons.update';
ALTER TYPE public.app_permission ADD VALUE 'persons.read' AFTER 'persons.delete';

ALTER TYPE public.app_permission ADD VALUE 'categories.update' AFTER 'persons.read';
ALTER TYPE public.app_permission ADD VALUE 'categories.delete' AFTER 'categories.update';

ALTER TYPE public.app_permission ADD VALUE 'messages.update' AFTER 'categories.delete';
ALTER TYPE public.app_permission ADD VALUE 'messages.delete' AFTER 'messages.update';

