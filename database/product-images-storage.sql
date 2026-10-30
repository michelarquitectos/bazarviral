-- Ejecutar una sola vez en el editor SQL de Supabase.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects for select to public using (bucket_id='product-images');
drop policy if exists "sellers_upload_product_images" on storage.objects;
create policy "sellers_upload_product_images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "sellers_update_product_images" on storage.objects;
create policy "sellers_update_product_images" on storage.objects for update to authenticated using (bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "sellers_delete_product_images" on storage.objects;
create policy "sellers_delete_product_images" on storage.objects for delete to authenticated using (bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
