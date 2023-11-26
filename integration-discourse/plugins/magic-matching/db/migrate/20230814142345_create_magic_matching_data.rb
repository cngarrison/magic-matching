class CreateMagicMatchingData < ActiveRecord::Migration[7.0]
  def up
    add_column :user_custom_fields, :magic_matching_userdata, :string
  end

  def down
    remove_column :user_custom_fields, :magic_matching_userdata
  end
end
