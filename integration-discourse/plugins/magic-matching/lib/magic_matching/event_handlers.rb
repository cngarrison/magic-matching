# frozen_string_literal: true

DiscourseEvent.on(:post_created) do |post, params, user|
  if MagicMatching.enabled? &&
     post.user.id > 0 && post.id > 0 && 
     post.topic.archetype != 'private_message' &&
     MagicMatching.post_watch_categories.include?(post.topic.category.id)

#         posted_category_name = Category.find_by(id: post.topic.category.id).name
#         Rails.logger.info("params: #{params}")
#         Rails.logger.info("post_watch_categories: #{MagicMatching.post_watch_categories}")
#         Rails.logger.info("post.topic.category.id: #{post.topic.category.id}")
#         Rails.logger.info("posted_category_name: #{posted_category_name}")
#         Rails.logger.info("user.id: #{user.id}")

        Jobs.enqueue(:call_magic_matching_api, user_id: user.id, post_id: post.id, action: 'post_created')

  end
end

# DiscourseEvent.on(:post_updated) do |post|
# DiscourseEvent.on(:post_destroyed) do |post|
# DiscourseEvent.on(:topic_created) do |topic|
# DiscourseEvent.on(:topic_updated) do |topic|
# DiscourseEvent.on(:topic_destroyed) do |topic|

DiscourseEvent.on(:user_created) do |user|
	if MagicMatching.enabled? && user.id > 0
		Jobs.enqueue(:call_magic_matching_api, user_id: user.id, action: 'user_created')
	end
end

DiscourseEvent.on(:user_updated) do |user|
	if MagicMatching.enabled? && user.id > 0
		Jobs.enqueue(:call_magic_matching_api, user_id: user.id, action: 'user_updated')
	end
end

	
