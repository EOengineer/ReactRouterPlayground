# frozen_string_literal: true

RSpec.shared_examples "requires authentication" do
  let(:request_method) { :get }

  it "returns unauthorized when not signed in" do
    public_send(request_method, request_path, as: :json)

    expect_json_error(:unauthorized, "Unauthorized")
  end
end
