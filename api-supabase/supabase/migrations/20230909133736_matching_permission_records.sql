-- changes to types must be committed before they can be used in INSERT statements
-- so created separate migration scripts to handle changes to types

INSERT INTO public.role_permissions (ROLE, permission)
    VALUES 
    ('app.owner', 'embeddings.admin'),
    ('app.owner', 'embeddings.update'),
    ('app.owner', 'embeddings.delete'),
    ('app.owner', 'persons.admin'),
    ('app.owner', 'persons.update'),
    ('app.owner', 'persons.delete'),
    ('app.owner', 'persons.read'),
    ('app.owner', 'categories.update'),
    ('app.owner', 'categories.delete'),
    ('app.owner', 'messages.update'),
    ('app.owner', 'messages.delete'),

    ('app.admin', 'embeddings.admin'),
    ('app.admin', 'persons.admin'),
    ('app.admin', 'categories.update'),
    ('app.admin', 'categories.delete'),
    ('app.admin', 'messages.update'),
    ('app.admin', 'messages.delete'),

    ('org.owner', 'embeddings.admin'),
    ('org.owner', 'persons.admin'),
    ('org.owner', 'categories.update'),
    ('org.owner', 'categories.delete'),
    ('org.owner', 'messages.update'),
    ('org.owner', 'messages.delete'),

    ('org.admin', 'embeddings.admin'),
    ('org.admin', 'persons.admin'),
    ('org.admin', 'categories.update'),
    ('org.admin', 'categories.delete'),
    ('org.admin', 'messages.update'),
    ('org.admin', 'messages.delete'),

    ('org.moderator', 'messages.update'),
    ('org.moderator', 'messages.delete');
