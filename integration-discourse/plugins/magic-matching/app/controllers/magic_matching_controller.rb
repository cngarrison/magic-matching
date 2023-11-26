# frozen_string_literal: true
require 'json' 

module ::MagicMatching
  class MagicMatchingController < ::ApplicationController
    skip_before_action :check_xhr
    protect_from_forgery except: :webhook
# 		skip_before_action :verify_authenticity_token, only: [:webhook]

    def webhook
      raw_request_body = request.body.read

      Rails.logger.info("MagicMatching raw_request_body: #{raw_request_body}")

      if raw_request_body.blank?
        render json: { error: "Empty request body" }, status: :bad_request
        return
      end
      
      begin
        request_args = JSON.parse(raw_request_body)
      rescue JSON::ParserError => e
        render json: { error: "Invalid JSON format", details: e.message }, status: :bad_request
        return
      end

      Rails.logger.info("MagicMatching webhook with data: #{request_args}")

    topic_id = request_args['topic_id'] # Obtain Topic ID from request parameters
    user_id = request_args['user_id'] || MagicMatching::MATCHER_USER_ID ## Discourse.system_user.id # Use system user if no user specified
    content = request_args['content'] # Content for the reply
    custom_field = request_args['custom_field'] # Any custom data
    
    # Validate input
    if topic_id.nil? || content.nil?
      render json: { error: "Topic ID and Reply Content are required." }, status: :bad_request
      return
    end

    # Create a reply
    create_topic_reply(topic_id, user_id, content, custom_field)



#       response_data = {
#         message: "Webhook received successfully",
#         timestamp: Time.now,
#         data: request_args
#       }
# 
#       render json: response_data, status: :ok
    end

		def create_topic_reply(topic_id, user_id, reply_content, custom_field = nil)
			post_creator = PostCreator.new(
				User.find(user_id),
				topic_id: topic_id,
				raw: reply_content
			)
	
			if custom_field
				# Add any custom logic or custom fields
# 				post_creator.custom_fields["my_custom_field"] = custom_field
			end
	
			post = post_creator.create
	
			if post.persisted?
				render json: { success: true, post_id: post.id }, status: :ok
			else
				render json: { success: false, errors: post.errors.full_messages }, status: :unprocessable_entity
			end
		end


  end
end
