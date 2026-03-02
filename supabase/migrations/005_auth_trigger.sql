-- =============================================================
-- Migration: 005_auth_trigger.sql
-- Supabase Auth 신규 사용자 → public.users 자동 동기화
-- =============================================================

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- admin role 승격 함수 (CLI/Dashboard에서만 직접 호출)
CREATE FUNCTION public.promote_to_admin(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET role = 'admin' WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
