import { CategoryService } from './../../admin/category.service';
// import { HeaderService } from './../../header/header.service';
import { ActivatedRoute, } from '@angular/router';
import { FormGroup, FormControl, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Component, OnInit, OnDestroy, Renderer2, ViewChild, AfterViewInit, AfterContentInit } from '@angular/core';
import { Post } from './../post.model';
import { PostService } from '../post.service';
import { mimeType } from './mime-type.validator';
import { Subscription, timer, Subject, Observable, concat, of, from } from 'rxjs';
import { tap, delay, concatMap, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-post-edit',
  templateUrl: './post-edit.component.html',
  styleUrls: ['./post-edit.component.scss']
})
export class PostEditComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
  @ViewChild('jodit') jodit;
  @ViewChild('selectTags') selectTags;
  mode;
  postId: string;
  postForm: FormGroup;
  imagePreview: any;
  post: Post;
  categories: any[] = []; // the data is not strict category !?!?, but with populate subcategories name
  subcategories: any[] = []; // the data is not strict category !?!?, but with populate subcategories name
  categoryselected;
  contentTextOnly = '';
  tagsArray: Observable<any[]>;
  loading: boolean;
  searchedTag = '';
  tagsInput = new Subject<string>();

  private categoriesSubscription: Subscription;
  jodiConfig = {
    // defaultMode: '3',
    height: 450,
    autofocus: true,
    enter: 'DIV',
    // uploader: {
    //   insertImageAsBase64URI: true,
    // },
    defaultActionOnPaste: 'insert_only_text',
    buttons: `source,
     |,bold,strikethrough,underline,italic,
     |,superscript,subscript,align,|,outdent,indent,|,ul,ol,
     |,font,fontsize,brush,paragraph,|,table,link,
     |,undo,redo,\n,cut,hr,eraser,copyformat,
     |,symbol,selectall,print`
  };

  constructor(
    private postService: PostService,
    // private headerService: HeaderService,
    private categoryService: CategoryService,
    public route: ActivatedRoute,
    private renderer: Renderer2,
  ) { }

  ngOnInit() {
    // throw new Error('My Pretty Error'); // for teting
    this.postForm = new FormGroup({
      image: new FormControl('', {
        validators: [Validators.required],
        asyncValidators: [mimeType]
      }),
      title: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)]),
      content: new FormControl(null, [
        Validators.required,
        this.contentValidatorLengthMin.bind(this),
        this.contentValidatorLengthMax.bind(this)]),
      category: new FormControl(null, [
        Validators.required]),
      subcategory: new FormControl(null, []),
      tags: new FormControl([], [
        this.tagsValidatorRequired,
        this.tagsValidatorLength,
        this.tagsValidatorCharacter,
      ])
    });

    // get mode(create/update) and Post ID
    this.postId = this.route.snapshot.params._id;
    if (this.postId) {
      this.mode = 'update';
      // 1. (async) get post
      this.postService.getPost(this.postId)
        .pipe(
          // delay(5000),
          concatMap((postData) => {
            // .subscribe((postData) => {
            this.post = postData.post;
            this.postForm.controls.image.setValue(this.post.imageMainPath);
            this.postForm.controls.title.setValue(this.post.title);
            this.postForm.controls.content.setValue(this.post.content);
            this.postForm.controls.category.setValue(this.post.category.name);
            const tagsArray = this.post.tags.reduce((accumulator, currentValue) => {
              accumulator.push(currentValue.name);
              return accumulator;
            }, []);
            this.postForm.controls.tags.setValue([...tagsArray]);


            this.loadTags();
            // 2. (async) get Categories -> to fill the ng-select categories options
            // and set the post category
            this.categoryService.getCategories();
            return this.categoryService.getCategoriesUpdateListener();
          })
        )
        .subscribe((categories) => {
          this.categories = [...categories];
          let currentCategory;
          currentCategory = this.categories.filter((category) => {
            if (category.name === this.post.category.name) {
              return category;
            }
          })[0];

          // 2.1. (sync) get Subcategories -> to fill the ng-select subcategories options (if such exists)
          if (currentCategory.subcategories) {
            this.subcategories = currentCategory.subcategories.reduce((accumulator, currentValue) => {
              accumulator.push(currentValue.name);
              return accumulator;
            }, []);
          }
          // 2.2. (sync) set ng-select subcategory input field (if such exists)
          if (this.post.subcategory) {
            this.postForm.controls.subcategory.setValue(this.post.subcategory.name);
          }

        });
    } else {
      this.mode = 'create';
      this.postId = null;
      this.loadTags();
      this.categoriesSubscription = this.categoryService.getCategoriesUpdateListener()
        .subscribe((categories: any[]) => {
          this.categories = [...categories];
        });


      // mongodb fake posts loading
      // -------------------------

      // this.addPosts({category: 'bulgaria', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/bulgaria.jpg'});

      // this.addPosts({ category: 'world', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/world.jpg' });

      // this.addPosts({ category: 'sport', subcategory: 'football', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/football.jpg' });
      // this.addPosts({ category: 'sport', subcategory: 'basketball', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/nba_Timberwolves%20.jpg' });
      // this.addPosts({ category: 'sport', subcategory: 'tennis', imageUrl: 'https://i.imgur.com/x0diArN.jpg' });

      // this.addPosts({ category: 'entertainment', subcategory: 'cinema', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/tennis.jpg' });
      // this.addPosts({ category: 'entertainment', subcategory: 'music', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/u2.jpg' });
      // this.addPosts({ category: 'entertainment', subcategory: 'art', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/culture.jpg' });

      // this.addPosts({ category: 'technology', subcategory: 'smartphones', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/Huawei%20Honor%20V20%206%2B128GB%20%20%20.jpg' });
      // this.addPosts({ category: 'technology', subcategory: 'electric cars', imageUrl: 'https://storage.googleapis.com/thenewsroom-images-storage-bucket/fake_posts_img/tesla.jpg' });

      // -------------------------
    }
  }
  ngAfterContentInit() {
  }
  ngAfterViewInit() {
  }

  get title() { return this.postForm.get('title'); }
  get category() { return this.postForm.get('category'); }
  get subcategory() { return this.postForm.get('subcategory'); }
  get tags() { return this.postForm.get('tags'); }
  get content() { return this.postForm.get('content'); }
  get image() { return this.postForm.get('image'); }

  get titleErrorRequired() {
    // const activated = this.username.errors.required;
    if (this.title.errors) {
      // console.log(this.title.errors);
      if (this.title.errors.required) {
        return true;
      }
    } else {
      return null;
    }
  }
  get titleErrorLengthMin() {
    if (this.title.errors) {
      if (this.title.errors.minlength) {
        return true;
      }
    } else {
      return null;
    }
  }
  get titleErrorLengthMax() {
    if (this.title.errors) {
      if (this.title.errors.maxlength) {
        return true;
      }
    } else {
      return null;
    }
  }
  get contentErrorRequired() {
    if (this.content.errors) {
      if (this.content.errors.required) {
        return true;
      }
    } else {
      return null;
    }
  }
  get contentErrorLengthMin() {
    if (this.content.errors) {
      if (this.content.errors.lengthErrorMin) {
        return true;
      }
    } else {
      return null;
    }
  }
  get contentErrorLengthMax() {
    if (this.content.errors) {
      if (this.content.errors.lengthErrorMax) {
        return true;
      }
    } else {
      return null;
    }
  }
  get categoryErrorRequired() {
    if (this.category.errors) {
      if (this.category.errors.required) {
        return true;
      }
    } else {
      return null;
    }
  }
  get tagsErrorRequired() {
    if (this.tags.errors) {
      if (this.tags.errors.requiredError) {
        return true;
      }
    } else {
      return null;
    }
  }
  get tagsErrorLength() {
    if (this.tags.errors) {
      if (this.tags.errors.lengthError) {
        return true;
      }
    } else {
      return null;
    }
  }
  get tagsErrorCharacter() {
    if (this.tags.errors) {
      if (this.tags.errors.characterError) {
        return true;
      }
    } else {
      return null;
    }
  }
  get imageErrorRequired() {
    if (this.image.errors) {
      if (this.image.errors.required) {
        return true;
      }
    } else {
      return null;
    }
  }
  get imageErrorInvalidMeme() {
    if (this.image.errors) {
      if (this.image.errors.invalidMimeType) {
        return true;
      }
    } else {
      return null;
    }
  }

  onSavePost() {
    if (this.postForm.invalid) { return; }
    // const userId = this.authService.getUserId();
    let post;
    let _id;
    if (this.mode === 'update') {
      _id = this.post._id;
    }
    const title = this.postForm.value.title;
    const content = this.postForm.value.content;
    const category = this.postForm.value.category;
    const subcategory = this.postForm.value.subcategory;
    const image = this.postForm.value.image;
    const tags = this.postForm.value.tags;
    post = {
      title,
      content,
      category,
      tags,
      image,
    };
    // post.subcategory = subcategory;
    if (subcategory) { post.subcategory = subcategory; }
    if (_id) { post._id = _id; }

    this.postService.editPost(post, this.mode);
    // this.postForm.reset();
  }

  // Image
  // ----------------------------------
  onImagePickerClicked() {
    return timer(2000).subscribe(() => {
      if (!this.image.value) {
        this.image.markAsTouched();
      }
    });
  }
  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    // console.log(file.type);
    // const isValidType = this.fileTypeCheck(file.type); // my checker
    // if(!isValidType) console.log('not valid'); // my checker

    this.postForm.patchValue({ image: file });
    this.image.updateValueAndValidity();

    // convert image to data url
    // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
    const reader = new FileReader();
    reader.onload = () => {
      // get the img src="imagePreview"
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);

  }

  // Content
  // ----------------------------------
  contentHandler(event) {
    // this.content.markAsTouched();
  }


  // Categories
  // ----------------------------------
  onCategorySelected() {
    this.categoryselected = this.categories.find((x) => x.name === this.category.value);
    this.subcategory.setValue(null);
  }

  // Subcategories
  // ----------------------------------
  onSubcategoryOpen() {
    if (this.categoryselected) {
      this.subcategories = [...this.categoryselected.subcategories];
    }
  }

  // Tags
  // ----------------------------------

  private loadTags() {
    // if (this.tagsInput.length > 1) {
    //   this.tagsArray = this.postService.getTagNames(this.tagsInput);
    // }
    this.tagsArray =
      concat(
        of([]), // default items
        this.tagsInput
          .pipe(
            debounceTime(1000),
            distinctUntilChanged(),
            tap(() => this.loading = true),
            switchMap((name) => this.postService.getTagNames(name)
              .pipe(
                catchError(() => {
                  this.loading = false;
                  return of([]);
                }), // empty list on error
                tap(() => this.loading = false)
              ))
          )
      );
  }
  onOpen() {
    // manually mark as touched, as otherwise it doesnt get fired

    // this.tags.markAsTouched();
  }
  onAdd(tag) {
    this.tags.setValue([...this.tags.value, tag]);
  }
  customSearchFn = () => {
    console.log('custom search');

  }


  // time laps simulator
  addTagPromise(name) {
    this.loading = true;
    return from([name])
      .pipe(
        // delay(1000),
        tap(() => this.loading = false),
      )
      .toPromise();
  }

  // ng-select internal
  addTag(name) {
    return { name: name, tag: true };
  }
  onRemove(tag) {

  }

  // gives entire ng-select object (for debugging etc...)
  onChange(select) {
    // console.log(select);
    // console.log(select.itemsList.selectedItems);
    // console.log(this.selectTags);
  }

  onSearch(letter) {
    if (letter.term.length > 1) {
      this.searchedTag = letter.term;
    }
  }

  // content length must be between 200 and 100000
  public contentValidatorLengthMin(control: AbstractControl): { [key: string]: boolean } {
    let lengthErrorIndicator = false;
    const controlHtmlContent = this.renderer.createElement('DIV');
    controlHtmlContent.innerHTML = control.value;
    let text = controlHtmlContent.innerText || controlHtmlContent.textContent;
    text = text.replace(/\s+/g, '').trim();
    if (text.length < 200) {
      lengthErrorIndicator = true;
    }
    return lengthErrorIndicator ? { lengthErrorMin: true } : null;
  }
  // content length must be between 200 and 100000
  public contentValidatorLengthMax(control: AbstractControl): { [key: string]: boolean } {
    let lengthErrorIndicator = false;
    const controlHtmlContent = this.renderer.createElement('DIV');
    controlHtmlContent.innerHTML = control.value;
    let text = controlHtmlContent.innerText || controlHtmlContent.textContent;
    text = text.replace(/\s+/g, '').trim();
    if (text.length > 10000) {
      lengthErrorIndicator = true;
    }
    return lengthErrorIndicator ? { lengthErrorMax: true } : null;
  }
  // there must be at least one tag
  private tagsValidatorRequired(controls: AbstractControl): { [key: string]: boolean } {
    let requiredErrorIndicator = false;
    if (controls['value'].length === 0) {
      requiredErrorIndicator = true;
    }
    return requiredErrorIndicator ? { requiredError: true } : null;
  }
  // tags must be between 2 and 25 characters each
  private tagsValidatorLength(controls: AbstractControl): { [key: string]: boolean } {
    let lengthErrorIndicator = false;
    if (controls['value'].length > 0) {
      controls['value'].forEach((tag) => {
        if (!tag) { return null; }
        if (tag.length < 2 || tag.length > 25) {
          lengthErrorIndicator = true;
        }
      });
      return lengthErrorIndicator ? { lengthError: true } : null;
    } else {
      return null;
    }
  }
  private tagsValidatorCharacter(controls: AbstractControl): { [key: string]: boolean } {
    let characterErrorIndicator = false;
    const regex = /^[\w\-\s]+$/;
    if (controls['value'].length > 0) {
      controls['value'].forEach((tag) => {
        if (!tag) { return null; }
        if (!regex.test(tag)) {
          characterErrorIndicator = true;
        }
      });
      return characterErrorIndicator ? { characterError: true } : null;
    } else {
      return null;
    }
  }

  // fake suvice
  private addPosts(options) {
    const fakePostsCount = 200;
    let counter = 100;
    let post;
    const category = options.category;
    const subcategory = options.subcategory;
    const imageUrl = options.imageUrl;
    if (subcategory) {
      while (counter < fakePostsCount) {
        post = {
          title: `Fake ${subcategory} title ${counter} is above 10 characters`,
          content: `Fake ${subcategory} content ${counter}  Fake content   Fake content  Fake content  Fake content   Fake content   Fake content  Fake content   Fake content  Fake content  Fake content   Fake content  Fake content  Fake content   Fake content  Fake content  Fake content   Fake content   Fake content  Fake content   Fake content  Fake content  Fake content   Fake content Fake content  Fake content   Fake content  Fake content  Fake content   Fake content   Fake content  Fake content   Fake content  Fake content  Fake content   Fake content`,
          category: category,
          subcategory: subcategory,
          tags: [`${subcategory} ${counter}`],
          image: imageUrl,
        };
        this.postService.editPost(post, this.mode);
        counter += 1;
      }
    } else {
      while (counter < fakePostsCount) {
        post = {
          title: `Fake ${category} title ${counter} is above 10 characters`,
          content: `Fake ${category} content ${counter}  Fake content   Fake content  Fake content  Fake content   Fake content   Fake content  Fake content   Fake content  Fake content  Fake content   Fake content  Fake content  Fake content   Fake content  Fake content  Fake content   Fake content   Fake content  Fake content   Fake content  Fake content  Fake content   Fake content Fake content  Fake content   Fake content  Fake content  Fake content   Fake content   Fake content  Fake content   Fake content  Fake content  Fake content   Fake content`,
          category: category,
          tags: [`${category} ${counter}`],
          image: imageUrl,
        };
        this.postService.editPost(post, this.mode);
        counter += 1;
      }
    }

  }


  ngOnDestroy() {
  }

}

