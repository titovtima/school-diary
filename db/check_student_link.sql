-- Посмотреть, какие пользователи-ученики есть и к каким ученикам привязаны
SELECT u.id, u.login, u.role, u.full_name, u.student_id, s.full_name AS student_name
FROM users u
LEFT JOIN students s ON s.id = u.student_id
WHERE u.role = 'student'
ORDER BY u.id;

-- Если есть ученик без student_id — привязать вручную:
-- UPDATE users SET student_id = 1 WHERE login = 'student3';
