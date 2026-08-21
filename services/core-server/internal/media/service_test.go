package media

import "testing"

func TestResolveProfile(t *testing.T) {
	thumb := ResolveProfile(false, false)
	if thumb.Name != "THUMB_STD" || thumb.Selected {
		t.Fatalf("unexpected thumbnail profile: %+v", thumb)
	}

	active := ResolveProfile(true, false)
	if active.Name != "ACTIVE" || active.FPS != 30 || !active.Selected {
		t.Fatalf("unexpected active profile: %+v", active)
	}

	active60 := ResolveProfile(true, true)
	if active60.Name != "ACTIVE_60" || active60.FPS != 60 || !active60.Selected {
		t.Fatalf("unexpected active60 profile: %+v", active60)
	}
}
