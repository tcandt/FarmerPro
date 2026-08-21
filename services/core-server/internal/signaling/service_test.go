package signaling

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateAndUpdateSession(t *testing.T) {
	service := NewService()

	body := bytes.NewBufferString(`{"deviceId":"device-04","profile":"ACTIVE"}`)
	createReq := httptest.NewRequest(http.MethodPost, "/v1/signaling", body)
	createRes := httptest.NewRecorder()
	service.HandleSignaling(createRes, createReq)
	if createRes.Code != http.StatusCreated {
		t.Fatalf("create status = %d", createRes.Code)
	}

	var created Session
	if err := json.NewDecoder(createRes.Body).Decode(&created); err != nil {
		t.Fatalf("decode create: %v", err)
	}
	if created.SessionID == "" || created.State != StateNegotiating {
		t.Fatalf("unexpected created session: %+v", created)
	}

	updateBody := bytes.NewBufferString(`{"answerSdp":"answer"}`)
	updateReq := httptest.NewRequest(http.MethodPatch, "/v1/signaling?sessionId="+created.SessionID, updateBody)
	updateRes := httptest.NewRecorder()
	service.HandleSignaling(updateRes, updateReq)
	if updateRes.Code != http.StatusOK {
		t.Fatalf("update status = %d", updateRes.Code)
	}

	var updated Session
	if err := json.NewDecoder(updateRes.Body).Decode(&updated); err != nil {
		t.Fatalf("decode update: %v", err)
	}
	if updated.State != StateReady || updated.AnswerSDP != "answer" {
		t.Fatalf("unexpected updated session: %+v", updated)
	}
}
